import api from "../utils/api";

export const getMyContactGroups = () => {
    return api.get("/contact-groups");
};

export const createContactGroup = (data) => {
    return api.post("/contact-groups", data);
};

export const updateContactGroup = (id, data) => {
    return api.put(`/contact-groups/${id}`, data);
};

export const deleteContactGroup = (id) => {
    return api.delete(`/contact-groups/${id}`);
};
