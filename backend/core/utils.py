import pandas as pd
import io
from typing import Dict, List, Any, Optional
from django.core.files.uploadedfile import InMemoryUploadedFile
import json


class ImportProcessor:
    """Class สำหรับประมวลผลไฟล์ import (xlsx/csv)"""
    
    def __init__(self, file: InMemoryUploadedFile):
        self.file = file
        self.df = None
        self.errors = []
        self.warnings = []
    
    def read_file(self) -> Dict[str, Any]:
        """อ่านไฟล์และแปลงเป็น DataFrame"""
        try:
            file_extension = self.file.name.split('.')[-1].lower()
            
            if file_extension == 'xlsx':
                self.df = pd.read_excel(self.file, engine='openpyxl')
            elif file_extension == 'csv':
                # Try different encodings
                try:
                    self.df = pd.read_csv(self.file, encoding='utf-8')
                except UnicodeDecodeError:
                    self.df = pd.read_csv(self.file, encoding='tis-620')
            else:
                self.errors.append(f"Unsupported file format: {file_extension}")
                return {'success': False, 'errors': self.errors}
            
            # Convert to dict format
            data = self.df.to_dict('records')
            
            return {
                'success': True,
                'data': data,
                'columns': list(self.df.columns),
                'row_count': len(self.df)
            }
        except Exception as e:
            self.errors.append(f"Error reading file: {str(e)}")
            return {'success': False, 'errors': self.errors}
    
    def preview(self, limit: int = 10) -> Dict[str, Any]:
        """Preview ข้อมูล (แสดงแค่บางแถว)"""
        result = self.read_file()
        if not result['success']:
            return result
        
        preview_data = result['data'][:limit]
        
        return {
            'success': True,
            'preview': preview_data,
            'columns': result['columns'],
            'total_rows': result['row_count'],
            'preview_rows': len(preview_data)
        }
    
    def validate_mapping(self, column_mapping: Dict[str, str]) -> Dict[str, Any]:
        """
        Validate column mapping
        column_mapping: {'field_name': 'column_name', ...}
        """
        # Ensure column_mapping is a dict
        import json
        if isinstance(column_mapping, str):
            try:
                column_mapping = json.loads(column_mapping)
            except (json.JSONDecodeError, TypeError):
                return {'success': False, 'errors': ['Invalid column_mapping format']}
        
        if not isinstance(column_mapping, dict):
            return {'success': False, 'errors': ['column_mapping must be a dictionary']}
        
        if self.df is None:
            self.read_file()
        
        if self.df is None:
            return {'success': False, 'errors': ['File not read yet']}
        
        validation_result = {
            'success': True,
            'errors': [],
            'warnings': [],
            'mapped_columns': {},
            'unmapped_columns': []
        }
        
        # ตรวจสอบว่า column ที่ map มีอยู่ในไฟล์หรือไม่
        available_columns = list(self.df.columns)
        
        for field_name, column_name in column_mapping.items():
            if column_name in available_columns:
                validation_result['mapped_columns'][field_name] = column_name
            else:
                validation_result['errors'].append(
                    f"Column '{column_name}' not found in file for field '{field_name}'"
                )
        
        # หา columns ที่ไม่ได้ map
        mapped_column_names = set(column_mapping.values())
        validation_result['unmapped_columns'] = [
            col for col in available_columns if col not in mapped_column_names
        ]
        
        if validation_result['errors']:
            validation_result['success'] = False
        
        return validation_result
    
    def process_data(
        self,
        column_mapping: Dict[str, str],
        validator_func: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Process ข้อมูลตาม column mapping
        validator_func: function(row_data) -> (is_valid, errors)
        """
        if self.df is None:
            self.read_file()
        
        if self.df is None:
            return {'success': False, 'errors': ['File not read yet']}
        
        processed_data = []
        errors = []
        
        for idx, row in self.df.iterrows():
            row_data = {}
            row_errors = []
            
            # Map columns
            for field_name, column_name in column_mapping.items():
                if column_name in row:
                    value = row[column_name]
                    # Handle NaN values
                    if pd.isna(value):
                        value = None
                    row_data[field_name] = value
                else:
                    row_errors.append(f"Column '{column_name}' not found")
            
            # Validate row
            if validator_func:
                is_valid, validation_errors = validator_func(row_data)
                if not is_valid:
                    row_errors.extend(validation_errors)
            
            if row_errors:
                errors.append({
                    'row': idx + 1,  # 1-based index
                    'errors': row_errors,
                    'data': row_data
                })
            else:
                processed_data.append(row_data)
        
        return {
            'success': len(errors) == 0,
            'data': processed_data,
            'errors': errors,
            'total_rows': len(self.df),
            'valid_rows': len(processed_data),
            'error_rows': len(errors)
        }


def create_audit_log(
    user,
    org,
    action: str,
    model: str,
    object_id: Optional[int] = None,
    changes: Optional[Dict] = None,
    request=None
) -> None:
    """Helper function สำหรับสร้าง audit log"""
    from core.models import AuditLog
    
    ip_address = None
    user_agent = ''
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    AuditLog.objects.create(
        org=org,
        user=user,
        action=action,
        model=model,
        object_id=object_id,
        changes=changes or {},
        ip_address=ip_address,
        user_agent=user_agent
    )


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

