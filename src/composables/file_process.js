export async function fileProcess(event) {
  const selectedFile = event.target.files[0];
  const fileName = selectedFile.name;
  const fileSize = event.target.files[0].size;
  // Await the resolution of the Promise returned by createBase64Image
  const result = await createBase64Image(selectedFile); // Temporarily capture the entire resolved value
  // Assuming the resolved value is as expected, now destructure it
  const { base64,fileType } = result;
  return {
    file:base64,
    file_type:fileType,
    file_name:fileName,
    file_length:fileSize
  }
}

function createBase64Image(fileObject) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const data = base64.split(",");
      const fileType = data[0].match(/data:([^;]*);/)[1];
      const fileSize = base64.size
      resolve({ base64, fileType }); // Ensure this matches the expected structure
    };
    reader.onerror = (error) => reject(error); // Properly reject the promise on error
    reader.readAsDataURL(fileObject);
  });
}
