// import React, { useState } from "react";
// import styles from "./css/Keywords.module.css"; // Assuming you have a CSS module for styling

// const Keywords = () => {
//   const [keywords, setKeywords] = useState([
//     { name: "Login", description: "Logs in a user", function: "loginUser" },
//     { name: "Logout", description: "Logs out a user", function: "logoutUser" },
//     { name: "Search", description: "Searches for an item", function: "searchItem" },
//   ]);

//   const handleDelete = (index) => {
//     const updatedKeywords = keywords.filter((_, i) => i !== index);
//     setKeywords(updatedKeywords);
//   };

//   return (
//     <div className={styles.keywordsContainer}>
//       <h1>Custom Keywords & Functions</h1>
//       <table className={styles.keywordsTable}>
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Description</th>
//             <th>Function</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {keywords.map((keyword, index) => (
//             <tr key={index}>
//               <td>{keyword.name}</td>
//               <td>{keyword.description}</td>
//               <td>{keyword.function}</td>
//               <td>
//                 <button
//                   className={styles.deleteButton}
//                   onClick={() => handleDelete(index)}
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default Keywords;


import React, { useState, useEffect } from "react";


import AceEditor from "react-ace";

import ace from "ace-builds/src-noconflict/ace";


// Import Ace modes/themes

import "ace-builds/src-noconflict/mode-javascript";

import "ace-builds/src-noconflict/theme-monokai";

// import "ace-builds/src-noconflict/worker-javascript"
ace.config.setModuleUrl("ace/mode/javascript_worker", require("ace-builds/src-noconflict/worker-javascript?url"));

function Keywords() {

    const [keywords, setKeywords] = useState(""); // content of editor

    const [savedKeywords, setSavedKeywords] = useState([]); // list of saved custom keywords

    // Mock API call - replace with backend fetch

    useEffect(() => {

        // Example: already saved keywords

        const existingKeywords = [

            {

                name: "clickButton",

                code: 'clickButton: async (page, step, test) => {\nif (!step.selector) throw new Error(`Missing selector for dblclick step`);\nconst selector = normalizeSelector(step.selector);\nawait page.locator(selector).dblclick();\n}',
            },

            {

                name: "enterText",

                code: "enterText: async (page, step, test) {\n  await page.fill(selector, step.vaue);\n}",

            },

        ];

        setSavedKeywords(existingKeywords);

    }, []);

    // Save new keyword

    const handleSave = () => {

        if (!keywords.trim()) return;

        const newKeyword = {

            name: `keyword_${savedKeywords.length + 1}`,

            code: keywords,

        };

        setSavedKeywords([...savedKeywords, newKeyword]);

        setKeywords("");

        // TODO: Send this to backend for persistence

    };

    return (
        <div className="p-4 grid grid-cols-2 gap-6">

            {/* Editor for new keyword */}
            <div className="border rounded-xl shadow-lg p-3">
                <h2 className="text-lg font-bold mb-2">Create / Edit Keyword</h2>
                <AceEditor

                    mode="javascript"

                    theme="monokai"

                    value={keywords}

                    onChange={(val) => setKeywords(val)}

                    name="keyword_editor"

                    width="100%"

                    height="300px"

                    editorProps={{ $blockScrolling: true }}
                    setOptions={{
                        useWorker: false, // Enable worker for syntax checking
                    }
                    }

                />
                <button

                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 mt-3 rounded-xl"

                    onClick={handleSave}
                >

                    Save Keyword
                </button>
            </div>

            {/* Saved keywords list */}
            <div className="border rounded-xl shadow-lg p-3 overflow-y-auto">
                <h2 className="text-lg font-bold mb-2">Saved Keywords</h2>

                {savedKeywords.length === 0 ? (
                    <p className="text-gray-500">No keywords yet.</p>

                ) : (

                    savedKeywords.map((kw, idx) => (
                        <div

                            key={idx}

                            className="mb-4 p-3 border rounded-lg bg-gray-900 text-white"
                        >
                            <h3 className="font-semibold text-yellow-300">{kw.name}</h3>
                            <pre className="text-sm whitespace-pre-wrap">{kw.code}</pre>
                        </div>

                    ))

                )}
            </div>
        </div>

    );

}

export default Keywords;
