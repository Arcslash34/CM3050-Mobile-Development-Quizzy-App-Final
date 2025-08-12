// // quiz-fetcher/fetchQuizSets.js
// const fs = require('fs');
// const path = require('path');
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


// // Create folder
// const outputDir = path.join(__dirname, 'QuizSet');
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir);
// }

// const BASE_URL = 'https://opentdb.com/api.php';
// const MIN_QUESTIONS = 8;
// const NUM_QUESTIONS = 10;
// const SETS_PER_DIFFICULTY = 2;
// const DIFFICULTIES = ['easy', 'medium', 'hard'];

// // 24 official OpenTrivia categories
// const categories = [
//   { id: 9, name: 'General Knowledge' },
//   { id: 10, name: 'Books' },
//   { id: 11, name: 'Film' },
//   { id: 12, name: 'Music' },
//   { id: 13, name: 'Musicals & Theatres' },
//   { id: 14, name: 'Television' },
//   { id: 15, name: 'Video Games' },
//   { id: 16, name: 'Board Games' },
//   { id: 17, name: 'Science & Nature' },
//   { id: 18, name: 'Computers' },
//   { id: 19, name: 'Mathematics' },
//   { id: 20, name: 'Mythology' },
//   { id: 21, name: 'Sports' },
//   { id: 22, name: 'Geography' },
//   { id: 23, name: 'History' },
//   { id: 24, name: 'Politics' },
//   { id: 25, name: 'Art' },
//   { id: 26, name: 'Celebrities' },
//   { id: 27, name: 'Animals' },
//   { id: 28, name: 'Vehicles' },
//   { id: 29, name: 'Comics' },
//   { id: 30, name: 'Gadgets' },
//   { id: 31, name: 'Anime & Manga' },
//   { id: 32, name: 'Cartoon & Animations' },
// ];

// const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// (async () => {
//   console.log(`🚀 Starting fetch for ${categories.length} categories...`);

//   for (const cat of categories) {
//     for (const difficulty of DIFFICULTIES) {
//       for (let setNum = 1; setNum <= SETS_PER_DIFFICULTY; setNum++) {
//         const url = `${BASE_URL}?amount=${NUM_QUESTIONS}&category=${cat.id}&difficulty=${difficulty}&type=multiple`;

//         console.log(`Fetching ${cat.name} (${difficulty}, Set ${setNum})...`);

//         try {
//           const res = await fetch(url);
//           const json = await res.json();

//           if (json.response_code === 0 && json.results.length >= MIN_QUESTIONS) {
//             const fileName = `cat${cat.id}_${difficulty}_set${setNum}.json`;
//             const filePath = path.join(outputDir, fileName);

//             fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
//             console.log(`✅ Saved: ${fileName}`);
//           } else {
//             console.warn(`⚠️ Skipped: ${cat.name} (${difficulty}, Set ${setNum}) — Only ${json.results.length} questions`);
//           }

//           await wait(6000); // Wait 6 seconds to respect rate limit
//         } catch (err) {
//           console.error(`❌ Error fetching ${cat.name} (${difficulty}, Set ${setNum}):`, err);
//         }
//       }
//     }
//   }

//   console.log('🎉 Done!');
// })();
