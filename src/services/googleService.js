import api from "../utils/api";

export const getGoogleAuthorizeUrl = () => {
  return api.get("/auth/google/authorize");
};

export const sendGoogleCallbackCode = (code) => {
  return api.post("/auth/google/callback", { code });
};
