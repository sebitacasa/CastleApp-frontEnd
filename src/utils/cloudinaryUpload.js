// Extraído de SearchScreen.js para poder reusarlo también desde DetailScreen
// (aportes de la comunidad) sin duplicar la misma lógica de upload.
const CLOUD_NAME = "dq4j7zh2a";
const UPLOAD_PRESET = "castleapp_upload";

export const uploadImageToCloudinary = async (imageUri) => {
  if (!imageUri) return null;
  const data = new FormData();
  let filename = imageUri.split('/').pop();
  let match = /\.(\w+)$/.exec(filename);
  let type = match ? `image/${match[1]}` : `image`;

  data.append('file', { uri: imageUri, name: filename, type });
  data.append('upload_preset', UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data
    });
    const result = await res.json();
    return result.secure_url || null;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};
