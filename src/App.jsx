import { useState } from "react";
import axios from "axios";

function App() {
  const [image, setImage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1];

      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Analyze the provided image and extract all multiple-choice questions (MCQs) exactly as they appear, maintaining the original language, structure, and formatting. Ensure precise and accurate extraction with no modifications to the original content.

### Extraction Rules:

1. **Extract ALL MCQs** – Do not skip any questions.
2. **Preserve exact wording** – Keep the original language, punctuation, and formatting. Do NOT translate or rephrase.
3. **Maintain order** – Questions should be in the exact sequence as they appear in the image.
4. **Replace visual elements** – If an image, diagram, chart, stamp, or table appears before a question, replace it with **"[image here]"** while keeping everything else intact.
5. **Identify text stamps** – If a text stamp (e.g., "নিচের চিত্রের আলোকে ১০ ও ১১নং প্রশ্নের উত্তর দাও।") appears before a question, don't get it.
6. **Ensure at least one correct answer** – Identify and extract correct options from checkmarks, highlights, labels, or surrounding hints.
7. **Extract reference & solution text** – If the question includes a reference (e.g., "[ঢা. বি. ২০২৪-২৫]" or "[ঢাকা নটরডেম কলেজ]"), extract it into "referenceText". Similarly, if an explanation is provided (under labels like "ব্যাখ্যা", "Solution", "Solve"), extract it into "solutionText".
8. **Use structured JSON output** – Return ONLY raw JSON in the exact format below. No additional text, explanations, markdown, or comments.

### Output Format (JSON Only):

[
  {
          "questionText": "string",
          "isExtraImageExist": "", // if image exists, replace with [image here]
          "referenceText": "",
          "solutionText": "",
          "options": [
            { "text": "string", "isCorrect": boolean }
          ]
        }
      ]

### Additional Guidelines:
- **If an extra image is associated with a question**, set "isExtraImageExist": "[image here]", otherwise leave it as an empty string "".
- **If no reference or solution exists**, set "referenceText": "" and "solutionText": "" (do NOT remove these fields).
- **Never assume correct answers** – Extract them from visible marks, labels, or annotations in the image.
- **No multiple correct answers** – If unsure, mark only one correct answer.`
              },
              {
                inlineData: {
                  mimeType: image.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      };

      try {
        const response = await axios.post(GEMINI_API_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          alert("No valid response from API");
          return;
        }

        let rawText = candidates[0]?.content?.parts[0]?.text || "";

        // Remove Markdown formatting if present
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
          const questionsArray = JSON.parse(rawText);
          setQuestions(questionsArray);
        } catch (jsonError) {
          console.error("JSON Parsing Error:", jsonError, "Response was:", rawText);
          alert("Failed to parse response. API might be returning an unexpected format.");
        }

      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image. Check API key and response format.");
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div>
      <h1>The Brain of Ayotto</h1>
      <p>The uniqueness of Ayotto AI that can reduce time, effort & cost</p>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Questions"}
      </button>
      {/* Displaying extracted questions */}
      {questions.length === 0 && <p>No questions found.</p>}
      {questions.length > 0 && (
        <div>
          <h2>Extracted Questions:</h2>
          {questions.map((q, index) => (
            <div key={index}>
              {q.questionText && <p>{q.questionText}</p>}
              {q.referenceText && <p>{q.referenceText}</p>}
              <ul>
                {q.options.map((option, idx) => (
                  <li key={idx} style={{ color: option.isCorrect ? "green" : "black" }}>
                    {option.text}
                  </li>
                ))}
              </ul>
              {q.solutionText && <p><strong>Solution:</strong> {q.solutionText}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
