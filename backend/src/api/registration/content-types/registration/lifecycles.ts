
export default {
  async afterUpdate(event) {
    const { result, params } = event;

    // Check if the status was updated to "Trúng tuyển"
    // Note: event.params.data contains the update payload
    if (params.data.status === 'Trúng tuyển') {
      try {
        // Fetch full registration details including relations if needed
        const registration = await strapi.entityService.findOne('api::registration.registration', result.id, {
          populate: ['campus', 'educationLevel'],
        });

        if (!registration || !registration.email) {
          console.log(`No email found for registration ${result.id}`);
          return;
        }

        const campusName = registration.campus?.name || 'Hải Phòng';
        const eduLevel = registration.educationLevel?.name || 'Cao đẳng';
        const major = registration.choice1Major || 'Đã chọn';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1e3a8a; color: #ffffff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">GIẤY BÁO TRÚNG TUYỂN</h1>
            </div>
            <div style="padding: 30px;">
              <p>Thân gửi em <strong>${registration.fullName}</strong>,</p>
              <p>Chúc mừng em đã trúng tuyển vào <strong>Trường Cao đẳng Hàng hải và Đường thủy I</strong>!</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Mã hồ sơ:</strong> ${registration.idNumber}</p>
                <p style="margin: 5px 0;"><strong>Ngành học:</strong> ${major}</p>
                <p style="margin: 5px 0;"><strong>Hệ đào tạo:</strong> ${eduLevel}</p>
                <p style="margin: 5px 0;"><strong>Cơ sở nhập học:</strong> ${campusName}</p>
              </div>

              <p>Nhà trường trân trọng mời em sớm hoàn thiện các thủ tục nhập học theo quy định. Em có thể xem chi tiết giấy báo và hướng dẫn nhập học bằng cách đăng nhập vào hệ thống tra cứu hồ sơ.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://tuyensinh1.mic1.edu.vn:82" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">TRA CỨU HỒ SƠ</a>
              </div>

              <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ Ban Tuyển sinh để được hỗ trợ.</p>
              <p>Trân trọng,</p>
              <p><strong>Ban Tuyển sinh</strong><br>Trường Cao đẳng Hàng hải và Đường thủy I</p>
            </div>
            <div style="background-color: #f3f4f6; color: #666; padding: 15px; text-align: center; font-size: 12px;">
              Đây là email tự động, vui lòng không trả lời email này.
            </div>
          </div>
        `;

        await strapi.plugin('email').service('email').send({
          to: registration.email,
          subject: '[GIẤY BÁO TRÚNG TUYỂN] - Trường Cao đẳng Hàng hải và Đường thủy I',
          html: htmlContent,
        });

        console.log(`Admission email sent to ${registration.email} for ID ${registration.idNumber}`);
      } catch (error) {
        console.error('Error sending admission email:', error);
      }
    }
  },
};
