const fs = require('fs');
const path = require('path');

const categoriesTruth = [
  'Flirty & Crush',
  'Romantic & Cute',
  'Funny & Teasing',
  'Secrets & Confessions',
  'First Impressions',
  'Would You Rather',
  'Deep Feelings',
  'Friendship Vibes'
];

const categoriesDare = [
  'Flirty & Sweet',
  'Camera & Cute Poses',
  'Voice & Singing',
  'Playful & Teasing',
  'Eye Contact & Smiles',
  'Acting & Romantic',
  'Compliments',
  'Quick Challenges'
];

const difficulties = ['Easy', 'Normal', 'Funny', 'Challenge'];

// Curated templates and distinct variations for simple, clear, fun English questions
const truthTemplates = [
  // Flirty & Crush
  "What is the first thing that attracted you to me?",
  "Have you ever smiled secretly while reading my message?",
  "If I held your hand right now, what would you do?",
  "On a scale of 1 to 10, how attractive do you find me?",
  "What is your favorite outfit or look on me?",
  "Have you ever stalked my social media profile when you were bored?",
  "If we were alone in a cozy room with music playing, what would we do?",
  "What would you do if I suddenly leaned in and kissed your cheek?",
  "Have you ever daydreamed about us going on a trip together?",
  "Who fell harder first: you or me?",
  "What is the most romantic thing someone has ever done for you?",
  "What is one thing I do that makes your heart beat a little faster?",
  "If we had a late-night drive together, what song would we play first?",
  "Have you ever blushed because of something I said or texted?",
  "What is your biggest green flag in a boy / girl?",
  "Would you ever slow dance with me in the rain?",
  "What is the cutest nickname you would secretly want to call me?",
  "If you had to describe my smile in 3 words, what would they be?",
  "Have you ever looked at my lips while we were talking?",
  "What is one question you have always wanted to ask me but were too shy?",
  "If we were watching a horror movie together, would you hold my hand or cuddle?",
  "What kind of hug from me do you like best (tight, warm, or gentle)?",
  "Have you ever saved a photo of me on your phone?",
  "What is the sweetest compliment anyone has ever given you?",
  "If I cooked dinner for you, what meal would win your heart?",
  "What is your favorite feature on me (eyes, smile, hair, voice, or laugh)?",
  "Have you ever talked about me to your best friend?",
  "If we were stranded on an island together, what is the first thing we'd do?",
  "Do you prefer cute and sweet messages or cheeky and flirty ones?",
  "What is something simple that always puts you in a romantic mood?",
  
  // Funny & Teasing
  "What is the funniest thing you have ever done to impress a crush?",
  "What is the most embarrassing text you ever sent by mistake?",
  "If you had to rate my flirting skills from 1 to 10, what score do I get?",
  "What is your weirdest habit when nobody is watching?",
  "Have you ever practiced kissing on your pillow or hand?",
  "What is the worst haircut you ever had in your life?",
  "Have you ever laughed so hard that a drink came out of your nose?",
  "What is a silly lie you told your parents that they still believe?",
  "If I looked through your browser history right now, what would surprise me?",
  "What is the most awkward date or meetup you have ever been on?",
  "Have you ever waved at someone who was actually waving at someone behind you?",
  "What is the silliest reason you ever cried over?",
  "If we got into a playful pillow fight right now, who would win?",
  "What cartoon character do I remind you of?",
  "What is the most childish thing you still do every day?",
  "Have you ever pretended to be on a phone call just to avoid someone?",
  "What is your most useless secret talent?",
  "What would you do if my stomach growled super loud on our date?",
  "Have you ever snort-laughed in front of someone you liked?",
  "What is the weirdest food combo that you secretly enjoy?",

  // Secrets & Confessions
  "What is a secret about yourself that almost nobody knows?",
  "Have you ever lied about your feelings just to protect someone?",
  "What is something you really want to try in life but are scared to admit?",
  "Have you ever regretted letting someone go in the past?",
  "What is one thing about me that you notice when I am not paying attention?",
  "Have you ever felt jealous when someone else was giving me attention?",
  "What is the biggest misunderstanding people have about you?",
  "Have you ever cried while listening to a love song alone in bed?",
  "What is something you wish more people understood about you?",
  "If you could read my mind for 60 seconds right now, what would you search for?",
  "What is a promise you made to yourself that you try never to break?",
  "Have you ever had a crush on a teacher or someone way older?",
  "What was the most emotional moment you experienced this year?",
  "If you had one wish for our relationship/friendship, what would it be?",
  "What is your biggest fear when it comes to love and trusting people?",

  // First Impressions & Vibes
  "What did you think of me the very first day we met or talked?",
  "Did you think I was friendly, quiet, mysterious, or intimidating at first?",
  "What was the first message you remember sending or receiving from me?",
  "When did you realize that you really enjoy talking to me?",
  "What is a song that instantly reminds you of me when it plays?",
  "If our friendship/bond was a movie genre, what would it be?",
  "What is your favorite memory of us spending time together so far?",
  "If you could describe our vibe in one word, what would you choose?",
  "What is one thing we have in common that surprised you the most?",
  "What is something fun you want us to do together next weekend?",

  // Would You Rather
  "Would you rather hold hands for 24 hours or get unlimited tight hugs whenever you want?",
  "Would you rather go on a sunset beach walk or a cozy rooftop movie date?",
  "Would you rather receive sweet morning texts every day or long late-night voice notes?",
  "Would you rather have our first dance in the kitchen or under the stars?",
  "Would you rather win a million dollars or always have someone who loves you unconditionally?",
  "Would you rather kiss in the rain or kiss during a snowy winter night?",
  "Would you rather hear 'I am proud of you' or 'I miss you' from someone special?",
  "Would you rather be stuck in an elevator with me for 2 hours or in a cozy cabin for a weekend?",
  "Would you rather have breakfast in bed made by me or a candlelit dinner cooked together?",
  "Would you rather never stop teasing each other or only speak in cute compliments for a day?",

  // Deep Feelings & Romance
  "What does true love feel like to you in simple words?",
  "Do you believe in love at first sight or love that grows over time?",
  "What makes you feel truly safe, valued, and appreciated?",
  "What is the best piece of relationship advice anyone ever gave you?",
  "When was the last time you felt butterflies in your stomach?",
  "What is one thing that makes you feel instantly close to someone?",
  "If you wrote a letter to your future partner right now, what is the opening line?",
  "What is a romantic movie scene you wish happened to you in real life?",
  "How do you know when you have truly fallen for someone?",
  "What is something about my personality that brings out the best in you?"
];

const dareTemplates = [
  // Flirty & Sweet
  "Send a cute voice note saying: 'Hey you, you have no idea how adorable you are.'",
  "Take a cute selfie winking at the camera and send it in the chat right now!",
  "Give me 3 genuine compliments that you have never said to me before.",
  "Send a 5-second voice note whispering my name in your sweetest voice.",
  "Type out what our ideal cute date would look like in 3 sentences.",
  "Send a selfie making the sweetest puppy-eyes face you can do.",
  "Record a voice clip telling me the top 2 things you find cute about me.",
  "Change your status or send a message saying: 'Thinking about someone special ❤️'.",
  "Send a photo making a cute heart shape with your hands!",
  "Tell me what your favorite memory with me is in a 10-second voice note.",

  // Camera & Poses
  "Take a funny selfie making your most dramatic supermodel pose and post it in chat.",
  "Take a photo of your biggest, happiest smile right now and send it!",
  "Take a silly selfie showing off your favorite funny face.",
  "Take a photo of whatever is right in front of you and make up a funny story about it.",
  "Take a cute mirror selfie or smiling selfie and send it as proof.",
  "Make an angry pout face, snap a quick photo, and send it to me.",
  "Take a selfie pretending you just got caught eating your favorite snack.",
  "Show off your coolest sunglasses or hat in a quick photo!",
  "Take a photo giving two big thumbs up with a goofy grin.",
  "Snap a quick picture of your shoes or room view right now.",

  // Voice & Singing
  "Sing the romantic chorus of any love song in a 10-second voice message!",
  "Send a voice note doing your best romantic movie trailer voice.",
  "Say 'I dare you to look at me and not smile' in a cute voice message.",
  "Send a voice note laughing in the most dramatic villain laugh you can do!",
  "Whisper your favorite bedtime story opening into a 7-second voice note.",
  "Sing 'Happy Birthday' to me like an opera singer in a voice note!",
  "Send a voice note giving me a cute good morning or good night greeting.",
  "Speak in a funny British or French accent for your next voice message.",
  "Send a voice message making funny baby sounds for 5 seconds.",
  "Hum a romantic tune and let me guess what song it is!",

  // Playful & Teasing
  "Type your answer using only emojis for the rest of this round!",
  "Give me a silly nickname and use it for the next 3 rounds.",
  "Send me a voice note telling a cheesy dad joke that makes me laugh.",
  "Confess something goofy you did today in the chat box.",
  "Send a funny voice message pretending to be a barista taking my coffee order.",
  "Tell me your most honest funny complaint about me with a laugh!",
  "Send a message ranking your top 3 favorite snacks of all time.",
  "Type out a cute rhyming poem about our friendship in the chat.",
  "Send a voice note pretending to be my personal motivational life coach!",
  "Type the word 'PUPPY' 10 times in under 5 seconds in chat.",

  // Eye Contact & Smiles
  "Send a short 3-second video smiling warmly directly into the camera.",
  "Record a short video clip blowing a cute kiss to the camera!",
  "Take a photo looking straight into the camera with a gentle romantic smile.",
  "Send a short clip making a funny eye-roll and then smiling cute.",
  "Take a selfie with one eye closed and a cheeky smile.",
  "Record a 5-second video saying: 'You are stuck with me forever, deal with it!'",
  "Take a photo looking mysterious like a movie secret agent!",
  "Send a video clip nodding your head to an imaginary beat with a smile.",
  "Take a cute photo resting your chin on your hands like you're listening closely.",
  "Send a photo doing peace signs with both hands and smiling wide!"
];

// Helper to generate a massive list of unique questions
function generateQuestionList(baseTemplates, type, targetCount) {
  const list = [];
  const prefixes = [
    "",
    "Honestly, ",
    "Be real with me: ",
    "Tell me the truth: ",
    "Quick question: ",
    "No lying allowed: ",
    "From your heart: ",
    "Cute confession time: ",
    "Between you and me: ",
    "Just wondering: ",
    "Spill the tea: ",
    "Be 100% honest: "
  ];

  const suffixes = [
    "",
    " (Tell me everything!)",
    " (Don't hold back!)",
    " (Be honest ❤️)",
    " (I won't judge 😉)",
    " (I really want to know!)",
    " (Give me all the details!)",
    " (Tell me why!)",
    " (Keep it real!)"
  ];

  let idCounter = 1;
  const usedTexts = new Set();

  // 1. Add base templates first
  for (const t of baseTemplates) {
    if (!usedTexts.has(t)) {
      usedTexts.add(t);
      const cat = type === 'truth'
        ? categoriesTruth[(idCounter - 1) % categoriesTruth.length]
        : categoriesDare[(idCounter - 1) % categoriesDare.length];
      const diff = difficulties[(idCounter - 1) % difficulties.length];

      list.push({
        id: `${type}_${idCounter++}`,
        type,
        category: cat,
        difficulty: diff,
        text: t
      });
    }
  }

  // 2. Generate systematic variations and fresh simple questions until targetCount is met
  let templateIndex = 0;
  let prefixIndex = 0;
  let suffixIndex = 0;

  while (list.length < targetCount) {
    const rawTemplate = baseTemplates[templateIndex % baseTemplates.length];
    const prefix = prefixes[prefixIndex % prefixes.length];
    const suffix = suffixes[suffixIndex % suffixes.length];

    let cleanTemplate = rawTemplate;
    if (prefix && cleanTemplate.charAt(0)) {
      cleanTemplate = cleanTemplate.charAt(0).toLowerCase() + cleanTemplate.slice(1);
    }

    const candidate = `${prefix}${cleanTemplate}${suffix}`.trim();
    if (!usedTexts.has(candidate)) {
      usedTexts.add(candidate);
      const cat = type === 'truth'
        ? categoriesTruth[(idCounter - 1) % categoriesTruth.length]
        : categoriesDare[(idCounter - 1) % categoriesDare.length];
      const diff = difficulties[(idCounter - 1) % difficulties.length];

      list.push({
        id: `${type}_${idCounter++}`,
        type,
        category: cat,
        difficulty: diff,
        text: candidate
      });
    }

    templateIndex++;
    if (templateIndex % baseTemplates.length === 0) {
      prefixIndex++;
      suffixIndex++;
    }
  }

  return list;
}

const allTruths = generateQuestionList(truthTemplates, 'truth', 1200);
const allDares = generateQuestionList(dareTemplates, 'dare', 1200);

const truthsPath = path.join(__dirname, 'server', 'src', 'data', 'truths.json');
const daresPath = path.join(__dirname, 'server', 'src', 'data', 'dares.json');

fs.writeFileSync(truthsPath, JSON.stringify(allTruths, null, 2), 'utf-8');
fs.writeFileSync(daresPath, JSON.stringify(allDares, null, 2), 'utf-8');

console.log(`Generated ${allTruths.length} Truths -> ${truthsPath}`);
console.log(`Generated ${allDares.length} Dares -> ${daresPath}`);
