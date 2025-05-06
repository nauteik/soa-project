package com.example.backend.service.impl;

import com.example.backend.dto.PaymentResponseDTO;
import com.example.backend.model.Order;
import com.example.backend.model.PaymentMethod;
import com.example.backend.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnPayService implements PaymentService {

    private final HttpServletRequest request;
    
    @Value("${vnpay.version}")
    private String vnpVersion;
    
    @Value("${vnpay.code}")
    private String vnpTmnCode;
    
    @Value("${vnpay.command}")
    private String vnpCommand;
    
    @Value("${vnpay.return-url}")
    private String vnpReturnUrl;
    
    @Value("${vnpay.hashsecret}")
    private String vnpHashSecret;
    
    @Value("${vnpay.api-url}")
    private String vnpApiUrl;
    
    @Value("${vnpay.paymentGateway}")
    private String vnPayUrl;
    
    @Override
    public PaymentResponseDTO createPayment(Order order, PaymentMethod paymentMethod) {
        try {
            // Kiểm tra xem phương thức thanh toán có được hỗ trợ không
            if (paymentMethod != PaymentMethod.VNPAY && 
                paymentMethod != PaymentMethod.MOMO &&
                paymentMethod != PaymentMethod.BANK_TRANSFER && 
                paymentMethod != PaymentMethod.CREDIT_CARD && 
                paymentMethod != PaymentMethod.E_WALLET) {
                
                PaymentResponseDTO response = new PaymentResponseDTO();
                response.setOrderId(order.getOrderNumber());
                response.setSuccess(false);
                response.setMessage("Phương thức thanh toán không được hỗ trợ");
                return response;
            }
            
            // Xử lý riêng cho từng phương thức thanh toán
            if (paymentMethod == PaymentMethod.MOMO) {
                // TODO: Thực hiện tích hợp với MoMo ở đây
                // Hiện tại chỉ mô phỏng và tạo URL dummy
                PaymentResponseDTO response = new PaymentResponseDTO();
                response.setOrderId(order.getOrderNumber());
                response.setSuccess(true);
                response.setPaymentUrl("https://sandbox.momo.vn/pay/" + order.getOrderNumber());
                response.setAmount(order.getTotalAmount().longValue());
                response.setCurrency("VND");
                response.setDescription("Thanh toán đơn hàng MoMo: " + order.getOrderNumber());
                response.setCreatedAt(System.currentTimeMillis());
                response.setPaymentMethod(paymentMethod.getDisplayName());
                return response;
            }
            
            // Xử lý thanh toán VNPAY và các phương thức khác
            String vnpIpAddr = getIpAddress();
            String vnpCurrCode = "VND";
            
            Map<String, String> vnpParams = new HashMap<>();
            vnpParams.put("vnp_Version", vnpVersion);
            vnpParams.put("vnp_Command", vnpCommand);
            vnpParams.put("vnp_TmnCode", vnpTmnCode);
            vnpParams.put("vnp_Locale", "vn");
            vnpParams.put("vnp_CurrCode", vnpCurrCode);
            vnpParams.put("vnp_TxnRef", order.getOrderNumber());
            vnpParams.put("vnp_OrderInfo", "Thanh toan don hang: " + order.getOrderNumber());
            vnpParams.put("vnp_OrderType", "billpayment");
            vnpParams.put("vnp_Amount", String.valueOf(order.getTotalAmount().multiply(new java.math.BigDecimal(100)).intValue()));
            vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
            vnpParams.put("vnp_IpAddr", vnpIpAddr);
            vnpParams.put("vnp_CreateDate", getCurrentDateFormatted());
            
            // Thêm thông tin hóa đơn
            vnpParams.put("vnp_BankCode", "");
            
            // Sắp xếp tham số
            List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
            Collections.sort(fieldNames);
            
            // Build hash data và query
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnpParams.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Build hash data
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    
                    // Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            
            String queryUrl = query.toString();
            String vnpSecureHash = hmacSHA512(vnpHashSecret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
            String paymentUrl = vnPayUrl + "?" + queryUrl;
            
            PaymentResponseDTO response = new PaymentResponseDTO();
            response.setOrderId(order.getOrderNumber());
            response.setSuccess(true);
            response.setPaymentUrl(paymentUrl);
            response.setAmount(order.getTotalAmount().longValue());
            response.setCurrency("VND");
            response.setDescription("Thanh toán đơn hàng: " + order.getOrderNumber());
            response.setCreatedAt(System.currentTimeMillis());
            response.setPaymentMethod(paymentMethod.getDisplayName());
            
            return response;
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException("Lỗi khi tạo URL thanh toán", e);
        }
    }
    
    @Override
    public boolean checkPaymentStatus(String orderId, String transactionId) {
        // Trong thực tế, cần gọi API của VnPay để kiểm tra trạng thái thanh toán
        // Ở đây chỉ mô phỏng, giả sử thanh toán luôn thành công nếu có transactionId
        return transactionId != null && !transactionId.isEmpty();
    }
    
    @Override
    public boolean handleCallback(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        
        // Xóa vnp_SecureHash để tính toán lại checksum
        params.remove("vnp_SecureHash");
        
        // Lấy tất cả các tham số
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        
        // Build hash data
        StringBuilder hashData = new StringBuilder();
        
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                try {
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (UnsupportedEncodingException e) {
                    throw new RuntimeException(e);
                }
                
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        
        // Tính toán lại checksum
        String secureHash = hmacSHA512(vnpHashSecret, hashData.toString());
        
        // So sánh checksums
        boolean checksumValid = secureHash.equals(vnpSecureHash);
        
        if (checksumValid) {
            String responseCode = params.get("vnp_ResponseCode");
            return "00".equals(responseCode); // 00 là mã thành công
        }
        
        return false;
    }
    
    private String hmacSHA512(String key, String data) {
        try {
            Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512_HMAC.init(secret_key);
            
            byte[] hash = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate hmac-sha512", e);
        }
    }
    
    private String getIpAddress() {
        String ipAddress = request.getHeader("X-Forwarded-For");
        
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        
        return ipAddress;
    }
    
    private String getCurrentDateFormatted() {
        return new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
    }
} 