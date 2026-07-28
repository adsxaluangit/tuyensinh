import { factories } from '@strapi/strapi';
import nodemailer from 'nodemailer';

export default factories.createCoreController('api::registration.registration', ({ strapi }) => ({

  // POST /api/registrations/send-bulk-email
  // Body: { items: [{ documentId: string, pdfBase64: string, studentName: string, email: string }] }
  async sendBulkEmail(ctx) {
    const { items } = ctx.request.body as {
      items: Array<{
        documentId: string;
        pdfBase64: string;     // data:application/pdf;base64,....
        studentName: string;
        email: string;
        campus: string;
        specialty: string;
        educationLevel: string;
        admissionHour?: string;
        admissionDay?: string;
        admissionMonth?: string;
        admissionYear?: string;
        announcer?: string;
        location?: string;
        hotline?: string;
        website?: string;
      }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('Danh sách items trống');
    }

    // Cấu hình SMTP từ biến môi trường
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });

    const results: { success: string[]; failed: string[]; noEmail: string[] } = {
      success: [],
      failed: [],
      noEmail: [],
    };

    for (const item of items) {
      if (!item.email || !item.email.includes('@')) {
        results.noEmail.push(item.studentName || item.documentId);
        continue;
      }

      // Tạo nội dung PDF attachment từ base64
      let attachments: any[] = [];
      if (item.pdfBase64) {
        try {
          // Loại bỏ prefix data URI nếu có
          const base64Data = item.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
          attachments = [{
            filename: `Giay_bao_trung_tuyen_${(item.studentName || '').replace(/\s+/g, '_')}.pdf`,
            content: Buffer.from(base64Data, 'base64'),
            contentType: 'application/pdf',
          }];
        } catch (e) {
          console.error(`Lỗi parse PDF cho ${item.studentName}:`, e);
        }
      }

      const htmlBody = buildEmailHtml(item);

      try {
        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Ban tuyển sinh'}" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
          to: item.email,
          subject: `THÔNG BÁO TRÚNG TUYỂN - ${item.studentName}`,
          html: htmlBody,
          attachments,
        });
        results.success.push(item.studentName || item.documentId);
      } catch (err: any) {
        console.error(`Lỗi gửi email cho ${item.studentName} (${item.email}):`, err?.message);
        results.failed.push(`${item.studentName} (${item.email})`);
      }
    }

    return ctx.send({
      message: `Gửi xong. Thành công: ${results.success.length}, Thất bại: ${results.failed.length}, Không có email: ${results.noEmail.length}`,
      success: results.success,
      failed: results.failed,
      noEmail: results.noEmail,
    });
  },
}));

// Xây dựng HTML nội dung email thông báo trúng tuyển
function buildEmailHtml(item: {
  studentName: string;
  campus?: string;
  specialty?: string;
  educationLevel?: string;
  admissionHour?: string;
  admissionDay?: string;
  admissionMonth?: string;
  admissionYear?: string;
  announcer?: string;
  location?: string;
  hotline?: string;
  website?: string;
}) {
  const now = new Date();
  const admissionTime = [
    item.admissionHour ? `${item.admissionHour} giờ` : '',
    item.admissionDay && item.admissionMonth && item.admissionYear
      ? `ngày ${item.admissionDay} tháng ${item.admissionMonth} năm ${item.admissionYear}`
      : '',
  ].filter(Boolean).join(', ');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo trúng tuyển</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;">
              ${item.announcer || 'TRƯỜNG CAO ĐẲNG HÀNG HẢI VÀ ĐƯỜNG THỦY I'}
            </p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
              🎓 THÔNG BÁO TRÚNG TUYỂN
            </h1>
            <p style="margin:10px 0 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
              Năm học ${now.getFullYear()}
            </p>
          </td>
        </tr>

        <!-- Congratulations banner -->
        <tr>
          <td style="background:#ecfdf5;padding:20px 40px;text-align:center;border-bottom:1px solid #d1fae5;">
            <p style="margin:0;font-size:16px;color:#065f46;font-weight:700;">
              🎉 Chúc mừng em <span style="color:#1e3a5f;">${item.studentName}</span> đã trúng tuyển!
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:14px;line-height:1.7;">
              ${item.announcer || 'Nhà trường'} trân trọng thông báo: Em <strong>${item.studentName}</strong> 
              đã trúng tuyển vào chương trình đào tạo của nhà trường. Chi tiết như sau:
            </p>

            <!-- Info table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;width:40%;">
                  <span style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Nghề đào tạo</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <strong style="color:#1e3a5f;font-size:14px;">${item.specialty || ''}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
                  <span style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Hệ đào tạo</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <span style="color:#374151;font-size:14px;">${item.educationLevel || ''}</span>
                </td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <span style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Cơ sở</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <span style="color:#374151;font-size:14px;">${item.campus || ''}</span>
                </td>
              </tr>
              ${admissionTime ? `
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
                  <span style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Thời gian nhập học</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                  <strong style="color:#dc2626;font-size:14px;">${admissionTime}</strong>
                </td>
              </tr>` : ''}
              ${item.location ? `
              <tr style="background:#f8fafc;">
                <td style="padding:12px 16px;">
                  <span style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Địa điểm nhập học</span>
                </td>
                <td style="padding:12px 16px;">
                  <span style="color:#374151;font-size:14px;">${item.location}</span>
                </td>
              </tr>` : ''}
            </table>

            <!-- PDF note -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#1e40af;font-size:13px;">
                📎 <strong>Giấy báo trúng tuyển</strong> được đính kèm trong email này (file PDF). 
                Em vui lòng in và mang theo khi đến nhập học.
              </p>
            </div>

            <p style="margin:0 0 8px 0;color:#374151;font-size:14px;line-height:1.7;">
              Để biết thêm thông tin, em vui lòng liên hệ:
            </p>
            <ul style="margin:0 0 24px 0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
              ${item.hotline ? `<li>📞 Hotline: <strong>${item.hotline}</strong></li>` : ''}
              ${item.website ? `<li>🌐 Website: <strong>${item.website}</strong></li>` : ''}
            </ul>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${now.getFullYear()} ${item.announcer || 'Trường CĐ Hàng hải và Đường thủy I'} — Email được gửi tự động, vui lòng không reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
