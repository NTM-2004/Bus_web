const QRCode = require('qrcode');

/**
 * Tạo QR code dưới dạng chuỗi base64
 * @param {Object} data - Dữ liệu cần mã hóa thành QR code
 * @param {Object} options - Tùy chọn cho QR code
 * @returns {Promise<string>} - Chuỗi base64 của QR code
 */
exports.generateQRCodeAsBase64 = async (data, options = {}) => {
  try {
    // Chuyển đổi dữ liệu thành chuỗi JSON
    const stringData = JSON.stringify(data);
    
    // Tùy chọn mặc định
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };
    
    // Kết hợp tùy chọn mặc định với tùy chọn người dùng
    const qrOptions = { ...defaultOptions, ...options };
    
    // Tạo QR code dưới dạng chuỗi base64
    const qrCodeBase64 = await QRCode.toDataURL(stringData, qrOptions);
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Tạo QR code và lưu thành file
 * @param {string} filePath - Đường dẫn file để lưu QR code
 * @param {Object} data - Dữ liệu cần mã hóa thành QR code
 * @param {Object} options - Tùy chọn cho QR code
 * @returns {Promise<void>}
 */
exports.generateQRCodeToFile = async (filePath, data, options = {}) => {
  try {
    // Chuyển đổi dữ liệu thành chuỗi JSON
    const stringData = JSON.stringify(data);
    
    // Tùy chọn mặc định
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };
    
    // Kết hợp tùy chọn mặc định với tùy chọn người dùng
    const qrOptions = { ...defaultOptions, ...options };
    
    // Tạo QR code và lưu vào file
    await QRCode.toFile(filePath, stringData, qrOptions);
  } catch (error) {
    console.error('Error generating QR code file:', error);
    throw error;
  }
};
