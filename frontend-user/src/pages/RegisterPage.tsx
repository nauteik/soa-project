import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config/constants";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const navigate = useNavigate();

  // Kiểm tra tính hợp lệ của email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Kiểm tra tính hợp lệ của mật khẩu
  const isValidPassword = (password: string): boolean => {
    // Kiểm tra không có khoảng trắng
    if (password.includes(" ")) {
      return false;
    }

    // Kiểm tra độ dài tối thiểu
    if (password.length < 6) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra họ tên
    if (name.trim().length < 2) {
      setError("Họ tên phải có ít nhất 2 ký tự");
      return;
    }

    // Kiểm tra email
    if (!isValidEmail(email)) {
      setError("Email không đúng định dạng");
      return;
    }

    // Kiểm tra mật khẩu
    if (!isValidPassword(password)) {
      setError(
        "Mật khẩu phải có ít nhất 6 ký tự và không được chứa khoảng trắng"
      );
      return;
    }

    // Kiểm tra mật khẩu nhập lại
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password
      });
      
      setIsRegistered(true);
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        "Đăng ký thất bại, vui lòng thử lại."
      );
      toast.error("Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Kiểm tra email của bạn</h1>
          <p className="text-gray-600 mb-4">
            Chúng tôi đã gửi một email xác nhận đến <strong>{email}</strong>.
          </p>
          <p className="text-gray-600 mb-6">
            Vui lòng kiểm tra hộp thư đến (và thư mục spam) để xác thực tài khoản của bạn.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Đến trang đăng nhập
            </button>
            <button
              onClick={() => setIsRegistered(false)}
              className="w-full bg-white text-primary border border-primary py-2 px-4 rounded-md hover:bg-primary/5 transition duration-200"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Đăng ký tài khoản
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Họ tên
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập họ tên của bạn"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập email của bạn"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              required
            />
          </div>

          <div className="mb-6">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition duration-200 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                Đang xử lý...
              </span>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
