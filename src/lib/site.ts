export const SITE = {
  name: "Buruj Sports Academy",
  address: "8, Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos",
  // TODO: replace with the academy's confirmed WhatsApp number
  whatsapp: "2348000000000",
  email: "info@burujsportsacademy.com",
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
};

export const waLink = (
  text = "Hello Buruj Sports Academy, I'd like to enquire about your programmes.",
) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

export const FEE_PLACEHOLDER = "Fee to be confirmed by admin";
