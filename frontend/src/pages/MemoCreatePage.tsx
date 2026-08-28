import { useState } from 'react';

export default function MemoCreatePage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create Memo</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Memo subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg h-64"
              placeholder="Memo content"
            />
          </div>

          <div className="flex gap-4">
            <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Save as Draft
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Continue to Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
