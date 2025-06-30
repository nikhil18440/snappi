import React, { useState } from 'react';

const ClipboardArea = ({ onClipboardChange }) => {
  const [content, setContent] = useState(null);
  const [type, setType] = useState(null);

  const handleTextPaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      setContent(text);
      setType('text');
      onClipboardChange({ type: 'text', content: text });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let fileType = 'file';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('application/')) fileType = 'doc';

      setContent(reader.result);
      setType(fileType);
      onClipboardChange({ type: fileType, content: reader.result });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className="border-2 border-dashed border-gray-400 p-6 rounded-xl w-full max-w-xl"
      onPaste={handleTextPaste}
    >
      <p className="text-sm text-gray-500 mb-3">
        Paste text using <span className="font-semibold">Ctrl+V</span> or upload a file:
      </p>
      <input
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="mb-4"
      />

      <div className="mt-4">
        {type === 'text' && (
          <p className="whitespace-pre-wrap text-gray-700">{content}</p>
        )}
        {type === 'image' && (
          <img src={content} alt="Clipboard" className="max-w-full rounded" />
        )}
        {type === 'video' && (
          <video controls className="w-full rounded">
            <source src={content} />
          </video>
        )}
        {type === 'doc' && (
          <a href={content} download className="text-blue-600 underline">
            Download Document
          </a>
        )}
      </div>
    </div>
  );
};

export default ClipboardArea;
