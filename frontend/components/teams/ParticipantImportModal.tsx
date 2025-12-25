'use client';

import { useState, useRef } from 'react';
import { teamsApi } from '@/lib/api/teams';
import Modal from '@/components/ui/Modal';
import { Upload, FileSpreadsheet, X, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ParticipantImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  created_count?: number;
  updated_count?: number;
  total_rows?: number;
  errors?: Array<{
    row: number;
    errors: string[];
    data: any;
  }>;
}

export default function ParticipantImportModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: ParticipantImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      setError('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv)');
      return;
    }
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    
    // Set expected columns for display
    setPreviewColumns(['ID', 'ชื่อ', 'นามสกุล', 'หน่วยงาน']);
    setPreview([]);
  };

  const handleImport = async () => {
    if (!file || !eventId) return;

    try {
      setImporting(true);
      setError(null);
      
      const response = await teamsApi.importParticipants(file, eventId);
      
      setResult({
        success: response.success || false,
        created_count: response.created_count || 0,
        updated_count: response.updated_count || 0,
        total_rows: response.total_rows || 0,
        errors: response.errors || [],
      });

      if (response.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      const errorData = err.response?.data || {};
      const errorMessage = errorData.error || errorData.message || err.message || 'เกิดข้อผิดพลาดในการ import';
      setError(errorMessage);
      
      // Handle different error formats
      let errorList: any[] = [];
      
      // Check for validation errors (array format)
      if (errorData.errors) {
        if (Array.isArray(errorData.errors)) {
          errorList = errorData.errors;
        } else if (typeof errorData.errors === 'string') {
          errorList = [{ row: 0, errors: [errorData.errors] }];
        }
      }
      
      // If no errors but has error message, create error entry
      if (errorList.length === 0 && errorMessage) {
        // Check if it's a column mapping error
        if (errorData.available_columns) {
          errorList = [{
            row: 0,
            errors: [
              `ไม่พบ columns ที่ต้องการ: ${errorData.expected_columns?.join(', ') || ''}`,
              `Columns ที่มีในไฟล์: ${errorData.available_columns.join(', ')}`
            ]
          }];
        } else {
          errorList = [{ row: 0, errors: [errorMessage] }];
        }
      }
      
      setResult({
        success: false,
        errors: errorList,
        total_rows: errorData.total_rows || 0,
        valid_rows: errorData.valid_rows || 0,
        error_rows: errorData.error_rows || errorList.length,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setPreviewColumns([]);
    setResult(null);
    setError(null);
    setLoading(false);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview([]);
    setPreviewColumns([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import รายชื่อผู้เข้าร่วมจาก Excel"
    >
      <div className="space-y-4">
        {/* File Upload Section */}
        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                คลิกเพื่อเลือกไฟล์หรือลากไฟล์มาวางที่นี่
              </p>
              <p className="text-xs text-gray-500">
                รองรับไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv)<br />
                <span className="text-emerald-600 font-medium">แนะนำ: ใช้ไฟล์ CSV จะสะดวกและเร็วกว่า</span>
              </p>
            </label>
          </div>
        )}

        {/* File Selected */}
        {file && !result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Column Mapping Info */}
            {previewColumns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  รูปแบบไฟล์ที่ต้องการ:
                </h4>
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium mb-1">
                    ⚠️ สิ่งสำคัญ:
                  </p>
                  <p className="text-xs text-yellow-700">
                    <strong>ไฟล์ต้องมีหัวข้อ (Header) ในแถวแรก</strong> เพื่อระบุชื่อคอลัมน์
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-emerald-100">
                        <tr>
                          {previewColumns.map((col) => (
                            <th
                              key={col}
                              className="px-4 py-2 text-left text-xs font-medium text-emerald-700 uppercase"
                            >
                              {col} <span className="text-yellow-600">(หัวข้อ)</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-600">12345</td>
                          <td className="px-4 py-2 text-sm text-gray-600">สมชาย</td>
                          <td className="px-4 py-2 text-sm text-gray-600">ใจดี</td>
                          <td className="px-4 py-2 text-sm text-gray-600">หน่วยงาน IT</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-1">คำอธิบาย:</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li><strong>ID:</strong> รหัสประจำตัวจากระบบโรงพยาบาล (ไม่บังคับ)</li>
                    <li><strong>ชื่อ:</strong> ชื่อจริงของผู้เข้าร่วม (จำเป็น)</li>
                    <li><strong>นามสกุล:</strong> นามสกุลของผู้เข้าร่วม (จำเป็น)</li>
                    <li><strong>หน่วยงาน:</strong> ชื่อหน่วยงาน/หน่วยงาน (จะสร้างใหม่อัตโนมัติถ้ายังไม่มี)</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>หมายเหตุ:</strong> ระบบจะรวมชื่อและนามสกุลเป็นชื่อเต็ม และจะอัปเดตรายชื่อที่มีอยู่แล้วถ้าชื่อซ้ำ
                  </p>
                </div>
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-800 font-medium mb-1">ตัวอย่างไฟล์ CSV:</p>
                  <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
{`ID,ชื่อ,นามสกุล,หน่วยงาน
12345,สมชาย,ใจดี,หน่วยงาน IT
67890,สมหญิง,รักดี,หน่วยงาน HR`}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Import Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={importing}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleImport}
                disabled={importing || loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลัง import...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-emerald-900 mb-2">
                      Import สำเร็จ!
                    </h4>
                    <div className="space-y-1 text-sm text-emerald-700">
                      <p>สร้างใหม่: {result.created_count || 0} รายการ</p>
                      <p>อัปเดต: {result.updated_count || 0} รายการ</p>
                      <p>ทั้งหมด: {result.total_rows || 0} แถว</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">
                      Import ไม่สำเร็จ
                    </h4>
                    <p className="text-sm text-red-700 mb-2">{error}</p>
                    
                    {/* Show column mapping error if available */}
                    {error.includes('Column mapping') && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-medium text-yellow-800 mb-2">
                          💡 ข้อมูลเพิ่มเติม:
                        </p>
                        <p className="text-xs text-yellow-700">
                          ระบบต้องการ columns: <strong>ID, ชื่อ, นามสกุล, หน่วยงาน</strong>
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          กรุณาตรวจสอบว่าไฟล์ของคุณมี columns เหล่านี้และชื่อตรงกันทุกตัวอักษร (รวมถึงช่องว่าง)
                        </p>
                      </div>
                    )}
                    
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-red-800 mb-1">
                          ข้อผิดพลาด ({result.errors.length} แถว):
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {result.errors.slice(0, 10).map((err, idx) => {
                            const errorMessages = Array.isArray(err.errors) 
                              ? err.errors.join(', ') 
                              : (err.errors || err.error || 'เกิดข้อผิดพลาด');
                            return (
                              <div
                                key={idx}
                                className="text-xs text-red-600 bg-red-100 p-2 rounded"
                              >
                                {err.row ? `แถว ${err.row}: ` : ''}{errorMessages}
                              </div>
                            );
                          })}
                          {result.errors.length > 10 && (
                            <p className="text-xs text-red-600">
                              ... และอีก {result.errors.length - 10} แถว
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-sm text-gray-600">กำลังอ่านไฟล์...</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

