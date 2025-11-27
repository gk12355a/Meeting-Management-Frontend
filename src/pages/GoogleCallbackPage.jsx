import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sendGoogleCallbackCode } from "../services/googleService";
import { toast } from "react-toastify";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      toast.error("Không tìm thấy mã xác thực!");
      navigate("/user/profile");
      return;
    }

    sendGoogleCallbackCode(code)
      .then(() => {
        toast.success("Liên kết Google Calendar thành công!");
        navigate("/user/profile");
      })
      .catch(() => {
        toast.error("Liên kết thất bại!");
        navigate("/user/profile");
      });
  }, []);

  return (
    <div className="p-10 text-center text-xl">
      ⏳ Đang xử lý liên kết Google Calendar...
    </div>
  );
};

export default GoogleCallbackPage;
