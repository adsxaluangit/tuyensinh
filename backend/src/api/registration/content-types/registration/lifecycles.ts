

export default {
  async beforeUpdate(event) {
    const { params } = event;
    const { data, where } = params;


    // Extract and handle the sync flag immediately to avoid validation errors
    const syncAmounts = data?.syncAmounts;
    if (data) delete data.syncAmounts;

    // Check if status is transitioning to "Trúng tuyển" or sync was requested
    if (data && (data.status === 'Trúng tuyển' || syncAmounts)) {
      try {
        const documentId = where?.documentId || params?.documentId;
        const id = where?.id;

        let existing: any = null;

        if (documentId) {
          existing = await strapi.documents('api::registration.registration').findOne({
            documentId,
            populate: ['campus', 'educationLevel']
          });
        } else if (id) {
          existing = await strapi.db.query('api::registration.registration').findOne({
            where: { id },
            populate: ['campus', 'educationLevel']
          });
        }

        if (!existing) {
          console.log('[Lifecycle] beforeUpdate: Record not found', { documentId, id });
          return;
        }


        // Only populate amounts if transitioning from another status to "Trúng tuyển" or sync was requested
        if (existing && (existing.status !== 'Trúng tuyển' || syncAmounts)) {
          console.log(`[Lifecycle] Status changing to "Trúng tuyển" for ${existing.idNumber}. Populating amounts...`);

          // 1. Fetch Tuition Amount based on Major, Campus and EduLevel
          const occupationFilters: any = {
            name: { $eq: existing.choice1Major }
          };

          if (existing.campus) {
            const campusDocId = existing.campus.documentId || (typeof existing.campus === 'string' ? existing.campus : null);
            const campusId = existing.campus.id || (typeof existing.campus === 'number' ? existing.campus : null);

            if (campusDocId) {
              occupationFilters.campus = { documentId: { $eq: campusDocId } };
            } else if (campusId) {
              occupationFilters.campus = { id: { $eq: campusId } };
            }
          }
          if (existing.educationLevel) {
            const levelDocId = existing.educationLevel.documentId || (typeof existing.educationLevel === 'string' ? existing.educationLevel : null);
            const levelId = existing.educationLevel.id || (typeof existing.educationLevel === 'number' ? existing.educationLevel : null);

            if (levelDocId) {
              occupationFilters.educationLevel = { documentId: { $eq: levelDocId } };
            } else if (levelId) {
              occupationFilters.educationLevel = { id: { $eq: levelId } };
            }
          }

          const occupations = await strapi.documents('api::occupation.occupation').findMany({
            filters: occupationFilters,
            limit: 1
          });

          if (occupations && occupations.length > 0) {
            data.tuitionAmount = occupations[0].amount;
          } else {
            console.log(`[Lifecycle] WARNING: No occupation found for ${existing.choice1Major} at ${existing.campus?.name}`);
          }

          // 2. Fetch default Health Insurance Amount
          const healthInsurances = await strapi.documents('api::health-insurance.health-insurance').findMany({
            limit: 1,
            sort: 'createdAt:desc'
          });
          if (healthInsurances && healthInsurances.length > 0) {
            data.healthAmount = healthInsurances[0].amount;
          }

          // 3. Fetch default Comprehensive Insurance Amount
          const compInsurances = await strapi.documents('api::comprehensive-insurance.comprehensive-insurance').findMany({
            limit: 1,
            sort: 'createdAt:desc'
          });
          if (compInsurances && compInsurances.length > 0) {
            data.comprehensiveAmount = compInsurances[0].amount;
          }

          // 4. Fetch default Uniform Amount
          const uniforms = await strapi.documents('api::uniform.uniform').findMany({
            limit: 1,
            sort: 'createdAt:desc'
          });
          if (uniforms && uniforms.length > 0) {
            data.uniformAmount = uniforms[0].amount;
          }

          console.log(`[Lifecycle] Populated amounts for ${existing.idNumber}: Tuition=${data.tuitionAmount}, Health=${data.healthAmount}, Comp=${data.comprehensiveAmount}, Uniform=${data.uniformAmount}`);
        }
      } catch (error) {
        console.error('[Lifecycle] Error in beforeUpdate amounts population:', error);
      }
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    const startTime = Date.now();

    // Check if the status was updated to "Trúng tuyển" and it hasn't been sent before
    if (params.data && params.data.status === 'Trúng tuyển') {
      try {
        console.log(`[Lifecycle] Processing status "Trúng tuyển" for registration ${result.idNumber || result.id}...`);

        // Use document service instead of entityService for Strapi 5 compatibility
        const registration = await strapi.documents('api::registration.registration').findOne({
          documentId: result.documentId,
          populate: ['campus', 'educationLevel'],
        });

        if (!registration || !registration.email) {
          console.log(`[Lifecycle] No email found or record not found for registration ${result.documentId}`);
          return;
        }

        const regData = registration as any;
        const campusName = regData.campus?.name || 'Hải Phòng';
        const eduLevel = regData.educationLevel?.name || 'Cao đẳng';
        const major = regData.choice1Major || 'Đã chọn';

        const attachments = [];
        if (regData.admissionNoticePdf && regData.admissionNoticePdf.includes('base64,')) {
          attachments.push({
            filename: `Giay_bao_nhap_hoc_${registration.fullName}_${registration.idNumber}.pdf`,
            content: regData.admissionNoticePdf.split('base64,')[1],
            encoding: 'base64',
          });
        }

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
                <p style="margin: 5px 0;"><strong>Mật khẩu tra cứu/chỉnh sửa:</strong> <span style="color: #dc2626; font-weight: bold;">${registration.password || 'N/A'}</span></p>
              </div>

              <p>Nhà trường trân trọng mời em sớm hoàn thiện các thủ tục nhập học theo quy định. Em có thể sử dụng <strong>Mã hồ sơ</strong> và <strong>Mật khẩu</strong> trên để đăng nhập vào hệ thống tra cứu tra cứu, in giấy báo và chỉnh sửa hồ sơ nếu cần thiết.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://tuyensinh1.mic1.edu.vn:82" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">TRA CỨU HỒ SƠ</a>
              </div>

              <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ Ban Tuyển sinh để được hỗ trợ.</p>
              <p>Điện thoại liên hệ: 0981.344.488- 0987.493.486.</p>
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
          attachments: attachments.length > 0 ? attachments : undefined
        });

        const duration = Date.now() - startTime;
        console.log(`[Lifecycle] Admission email sent to ${registration.email} for ID ${registration.idNumber} ${attachments.length > 0 ? 'with attachment' : 'without attachment'} in ${duration}ms`);
      } catch (error) {
        console.error('[Lifecycle] Error sending admission email:', error);
      }
    }
  },
};
