'use client';

/**
 * หน้ารวม Score (Public Page)
 * 
 * หน้าที่:
 * - แสดงตารางคะแนนรวมของทุกทีม
 * - แสดงผลแบบเรียลไทม์เมื่อมีการอัปเดตคะแนน
 * - ใช้ WebSocket เพื่ออัปเดตผลแบบทันที
 * - แสดงผลแบบ Fullscreen สำหรับ Projector
 * - ไม่ต้อง Login
 * 
 * Features:
 * - ตารางคะแนนรวม (Leaderboard)
 * - แสดงคะแนนแต่ละกีฬา
 * - แสดงคะแนนรวมทั้งหมด
 * - Ranking แบบเรียลไทม์
 * - Animation เมื่อมีการเปลี่ยนแปลงอันดับ
 * - รองรับ Dark Mode สำหรับ Projector
 * 
 * Data Structure:
 * - Team Name
 * - Score per Sport
 * - Total Score
 * - Rank
 * - Last Updated
 */
export default function SportsScoreboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8">🏆 ตารางคะแนนรวม</h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-300">
              หน้านี้จะแสดงตารางคะแนนรวมของทุกทีมแบบเรียลไทม์
            </p>
            <p className="text-sm text-gray-400 mt-4">
              (กำลังพัฒนา - จะเชื่อมต่อกับ WebSocket เพื่อแสดงผลแบบทันที)
            </p>
          </div>
          
          {/* Placeholder Table */}
          <div className="bg-white/5 rounded-lg p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-4 text-lg font-semibold">อันดับ</th>
                  <th className="pb-4 text-lg font-semibold">ทีม</th>
                  <th className="pb-4 text-lg font-semibold text-right">คะแนนรวม</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-4 text-2xl font-bold">1</td>
                  <td className="py-4">ทีมสีแดง</td>
                  <td className="py-4 text-right text-2xl font-bold">150</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-4 text-2xl font-bold">2</td>
                  <td className="py-4">ทีมสีน้ำเงิน</td>
                  <td className="py-4 text-right text-2xl font-bold">145</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-4 text-2xl font-bold">3</td>
                  <td className="py-4">ทีมสีเขียว</td>
                  <td className="py-4 text-right text-2xl font-bold">140</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

