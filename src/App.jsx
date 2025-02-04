import { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [questions, setQuestions] = useState([]);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
      } else {
        alert("Error processing image");
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div>
      <h1>The Brain of Ayotto</h1>
      <p>The uniqueness of Ayotto AI that can reduce time, effort & cost</p>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {questions.length > 0 && (
        <div>
          <h2>Extracted Questions:</h2>
          {questions.map((q, index) => (
            <div key={index}>
              <p>{q.questionText}</p>
              <ul>
                {q.options.map((option, idx) => (
                  <li key={idx} style={{ color: option.isCorrect ? "green" : "black" }}>
                    {option.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
