// Extraído de SearchScreen.js para poder reusarlo también desde DetailScreen
// (aportes de la comunidad) sin duplicar la misma lógica de upload.
const CLOUD_NAME = 'dq4j7zh2a';
const UPLOAD_PRESET = 'castleapp_upload';

export const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
  if (!imageUri) return null;
  const data = new FormData();
  const filename = imageUri.split('/').pop() ?? 'upload';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  // @ts-ignore — React Native FormData accepts { uri, name, type } objects
  data.append('file', { uri: imageUri, name: filename, type });
  data.append('upload_preset', UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
    });
    const result = await res.json();
    return (result.secure_url as string) || null;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};
