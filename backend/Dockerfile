# Sử dụng image Java chính thức
FROM eclipse-temurin:21-jre

# Tạo thư mục app trong container
WORKDIR /app

# Copy file JAR vào container (chỉnh lại tên file JAR cho đúng)
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port (Render sẽ tự động set biến PORT)
EXPOSE 8080

# Lệnh chạy ứng dụng, chú ý lấy PORT từ biến môi trường
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]