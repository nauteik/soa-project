import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config/constants";

const VerifyAccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token xác thực không hợp lệ.");
      return;
    }

    const verifyAccount = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/verify?token=${token}`, {
          timeout: 15000 // 15 giây
        });
        setStatus("success");
        setMessage(response.data.message);
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.error ||
          "Xảy ra lỗi khi xác thực tài khoản. Vui lòng thử lại sau."
        );
      }
    };

    verifyAccount();
  }, [token]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">Xác thực tài khoản</h1>

        <div className="py-4">
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Đang xác thực tài khoản của bạn...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-700 mb-6">{message}</p>
              <button
                onClick={handleGoToLogin}
                className="bg-primary text-primary-foreground py-2 px-6 rounded-md hover:bg-primary/90 transition duration-200"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-700 mb-6">{message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition duration-200"
                >
                  Quay lại đăng ký
                </button>
                <button
                  onClick={handleGoToLogin}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
                >
                  Đến trang đăng nhập
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccountPage; 