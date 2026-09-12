import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const truthCategories = [
  'Flirty & Crush',
  'Romantic & Cute',
  'Funny & Teasing',
  'Secrets & Confessions',
  'First Impressions',
  'Would You Rather',
  'Deep Feelings',
  'Friendship Vibes'
];

const dareCategories = [
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

// Handcrafted, simple English flirty/fun truths
const simpleFlirtyTruths = [
  "What was your honest first impression of me when we first met?",
  "What is the first thing you noticed about me (my smile, eyes, style, or voice)?",
  "Have you ever had a secret crush on me or someone we both know?",
  "What is one cute or attractive habit of mine that you like?",
  "If we went on a dream date together, where would you take me?",
  "What is your idea of a perfect romantic evening?",
  "Have you ever stalked my social media profile or photos?",
  "What kind of outfit or look do you think suits me best?",
  "If you had to describe me using only 3 sweet words, what would they be?",
  "Have you ever smiled at your phone while reading a text from me?",
  "Who usually takes longer to get ready: boys or girls?",
  "What is the most romantic movie or song that makes you emotional?",
  "Do you believe in love at first sight or love after becoming best friends?",
  "What is your biggest turn-on in someone's personality (humor, kindness, confidence)?",
  "If we were stuck in an elevator for 2 hours, what would we talk about?",
  "What is a cute nickname you would give me?",
  "Have you ever rehearsed what to say to someone before calling or texting them?",
  "What is the sweetest compliment anyone has ever given you?",
  "If I cooked dinner for you, what would you want me to make?",
  "What is one thing about me that always makes you smile?",
  "Would you ever go on a late-night drive with me just to listen to music?",
  "What is your favorite feature about yourself?",
  "Have you ever had a dream about me? What happened?",
  "What is something you find super attractive that most people ignore?",
  "If you could hold my hand right now, would you?",
  "What is your biggest fear when it comes to dating or love?",
  "Do you prefer cute hugs, holding hands, or deep conversations?",
  "If we were in a romantic comedy movie, how would our story start?",
  "What is the most embarrassing thing you did in front of someone you liked?",
  "Are you shy when you like someone, or do you make the first move?",
  "What song always reminds you of me or a crush?",
  "What is the cutest text message you have ever received?",
  "If you had to slow dance with me to one song right now, which song would it be?",
  "Have you ever checked your hair or mirror right before meeting me?",
  "What is one secret talent you have that you haven't shown me yet?",
  "Do you prefer funny partners or romantic partners?",
  "What would you do if I suddenly gave you a tight hug?",
  "What is something about boys/girls that you find mysterious or cute?",
  "If we went to a photo booth together, what kind of funny/cute poses would we make?",
  "What is the most thoughtful thing someone could do for you on your birthday?",
  "Have you ever felt butterflies in your stomach when talking to someone?",
  "What is your favorite memory of us talking or hanging out?",
  "If I asked you out on a surprise date tomorrow, would you say yes?",
  "What is a quality in me that you wish more people had?",
  "Do you prefer morning good-morning texts or late-night good-night calls?",
  "What is your favorite compliment to receive?",
  "If we went stargazing tonight, what would you wish for?",
  "What is the biggest green flag you look for in someone?",
  "Have you ever saved a photo of someone because you thought they looked cute?",
  "If you could ask me any one honest question with zero hesitation, what would it be?"
];

// Handcrafted, simple English flirty/fun dares
const simpleFlirtyDares = [
  "Look directly into the camera and give your best charming smile for 10 seconds.",
  "Send a cute voice note or say: 'You look really cute today!' with feeling.",
  "Give me 3 genuine compliments about my smile, eyes, or personality.",
  "Do a wink and blow a playful kiss to the camera.",
  "Sing 15 seconds of your favorite romantic or pop song.",
  "Hold eye contact with the camera for 15 seconds without laughing or looking away.",
  "Call me a cute nickname (like 'Cutie', 'Sunshine', or 'Captain') for the rest of the game.",
  "Act like you are asking me out on a romantic first date for 20 seconds.",
  "Show your best model pose to the camera with confidence.",
  "Make a heart sign with your hands and hold it for 10 seconds.",
  "Say 'I really like hanging out with you' in 3 different accents (sweet, dramatic, whisper).",
  "Send a cute selfie or show your best smiling face to the camera right now.",
  "Describe your dream date with me in 20 seconds without stopping.",
  "Give me your best 10-second pickup line with a confident smile.",
  "Whisper your favorite secret wish to the camera.",
  "Do a cute 10-second slow dance or head-bop to imaginary music.",
  "Pretend I just walked in wearing a stunning outfit and react with genuine surprise.",
  "Say the alphabet backwards until I tell you to stop, but look at me the whole time.",
  "Show the nearest cute item in your room and dedicate it to me.",
  "Speak in a soft, sweet ASMR whisper for the next 2 turns.",
  "Compliment my hairstyle and clothing right now.",
  "Do 5 gentle heart-finger poses like a K-pop idol.",
  "Act out how you react when you get a text from your crush.",
  "Say 'You are special to me' in another language (French, Spanish, Italian, etc.).",
  "Give your best shy smile and blush for the camera.",
  "Read the last sweet message in your chat out loud.",
  "Promise to send me a funny or cute meme after this game ends.",
  "Do a 15-second catwalk strut in your room like a fashion model.",
  "Tell me what your favorite thing about my personality is in 15 seconds.",
  "Close your eyes and describe how you imagine our next meetup will be."
];

// Systematic generators with simple, clear English templates
function generateCleanQuestions() {
  const truths = [];
  const dares = [];
  let truthId = 1;
  let dareId = 1;

  // Add base seeds
  simpleFlirtyTruths.forEach((text, i) => {
    truths.push({
      id: `t_${truthId++}`,
      type: 'truth',
      category: truthCategories[i % truthCategories.length],
      difficulty: difficulties[i % difficulties.length],
      text
    });
  });

  simpleFlirtyDares.forEach((text, i) => {
    dares.push({
      id: `d_${dareId++}`,
      type: 'dare',
      category: dareCategories[i % dareCategories.length],
      difficulty: difficulties[i % difficulties.length],
      text
    });
  });

  // Simple Truth Templates
  const truthTemplates = [
    (topic, cat) => `What is your honest opinion about ${topic}?`,
    (topic, cat) => `Have you ever felt nervous or excited when ${topic}?`,
    (topic, cat) => `If we did ${topic} together, do you think it would be fun or romantic?`,
    (topic, cat) => `What is the cutest thing about ${topic} in your opinion?`,
    (topic, cat) => `Would you rather ${topic} with me or watch a funny movie together?`,
    (topic, cat) => `What is your favorite memory involving ${topic}?`,
    (topic, cat) => `If you had to rate your love for ${topic} from 1 to 10, what would you give it?`,
    (topic, cat) => `What would you say if I surprised you with ${topic}?`,
    (topic, cat) => `Do you think ${topic} is cute, funny, or romantic?`,
    (topic, cat) => `Tell me the truth: how often do you think about ${topic}?`
  ];

  const topics = [
    'holding hands in public', 'late-night phone calls that last for hours', 'sharing hoodies or jackets',
    'going on a beach walk at sunset', 'sharing a dessert with two spoons', 'taking cute polaroid photos together',
    'surprising each other with sweet gifts', 'slow dancing in the living room', 'making a special music playlist for each other',
    'watching stars on a quiet night', 'cooking a fun dinner together', 'going on a spontaneous road trip',
    'giving forehead kisses or warm hugs', 'sending good morning voice notes', 'playful teasing and friendly jokes',
    'remembering small details about each other', 'matching phone wallpapers or outfits', 'buying each other favorite snacks',
    'planning cute weekend dates', 'celebrating special milestones together', 'laughing at silly inside jokes',
    'whispering secrets in crowded places', 'texting all day without getting bored', 'watching sunsets from a high rooftop',
    'writing sweet handwritten letters or notes', 'walking in the gentle rain with one umbrella', 'holding eye contact across a room',
    'giving genuine compliments out of nowhere', 'cheering each other up on a bad day', 'dreaming about future adventures together',
    'ordering food for each other without asking', 'taking long walks in a cozy park', 'sharing earphones while listening to music',
    'taking silly selfie videos together', 'making funny faces until someone laughs', 'talking about childhood dreams and memories',
    'giving cute nicknames to each other', 'remembering the exact day we first met', 'sending funny reaction emojis back and forth',
    'staying up past midnight just talking', 'going to an amusement park and holding hands on rides', 'having a cozy movie marathon on the couch',
    'going for ice cream on a warm night', 'leaving sweet notes in unexpected places', 'cheering each other on during challenges',
    'sharing your deepest thoughts without fear', 'feeling completely comfortable around each other', 'having a cute laughing fit together',
    'traveling to a brand new city together', 'promising to always be there for each other'
  ];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    for (let t = 0; t < truthTemplates.length; t++) {
      const cat = truthCategories[(i * truthTemplates.length + t) % truthCategories.length];
      const diff = difficulties[(i + t) % difficulties.length];
      const text = truthTemplates[t](topic, cat);
      truths.push({
        id: `t_${truthId++}`,
        type: 'truth',
        category: cat,
        difficulty: diff,
        text
      });
    }
  }

  // Simple Dare Templates
  const dareTemplates = [
    (act) => `Look into the camera and ${act} with a sweet smile.`,
    (act) => `Say to me in your softest voice: "${act}".`,
    (act) => `Act out for 15 seconds: ${act}.`,
    (act) => `Give your best 10-second attempt to ${act}.`,
    (act) => `Without laughing, ${act} for the next 15 seconds.`,
    (act) => `Send a quick smile and ${act}.`,
    (act) => `Show me your cute side: ${act}.`,
    (act) => `Do your best impression of someone trying to ${act}.`,
    (act) => `Take a deep breath, smile at the camera, and ${act}.`,
    (act) => `Pretend you are in a cute romantic movie and ${act}.`
  ];

  const actions = [
    'say "You always make my day brighter"',
    'give 2 sweet reasons why you enjoy our conversations',
    'wink at the camera with a charming smile',
    'make a cute heart shape with both hands',
    'whisper a sweet compliment about my eyes or smile',
    'sing the chorus of a love song for 10 seconds',
    'tell me your favorite cute nickname for me',
    'hold eye contact for 12 seconds with a gentle smile',
    'do your best confident model pose',
    'say "I am so glad we are playing this game together"',
    'describe what you like most about my vibe',
    'do a cute wave and blow a friendly kiss',
    'tell me what kind of cute date we should go on',
    'say 3 nice things about me in under 15 seconds',
    'smile warmly and say "You look really nice today"',
    'do a funny 5-second celebratory dance',
    'act like you just won a date with your biggest crush',
    'speak in a sweet whisper for the next 30 seconds',
    'tell me what song reminds you of us',
    'give me your sweetest smile and hold it for 10 seconds',
    'say "You are one of my favorite people" with feeling',
    'act shy for 10 seconds like you just got a big compliment',
    'describe my smile in 3 creative words',
    'make a pinky promise to text me something nice tomorrow',
    'tell me the sweetest memory we share so far',
    'act like you are giving me a warm cup of hot chocolate',
    'do a cute slow-motion head turn and smile',
    'show me your favorite photo or wallpaper on your phone',
    'say "Good luck beating my score, cutie!"',
    'give a 10-second speech on why our friendship is awesome',
    'imitate how I laugh when something is really funny',
    'strike a cute superhero pose and wink',
    'say "You have great taste in music" in a fancy accent',
    'tell me 1 secret dream you have never told anyone else',
    'act like you are giving a surprise gift to your crush',
    'give 2 honest reasons why you enjoy talking to me',
    'say "You are looking extra sharp today" with a laugh',
    'do 5 celebratory high-fives towards the camera screen',
    'tell me the title of a song that describes our vibe',
    'whisper your favorite compliment you ever got',
    'do your best cute puppy-eyes face for 10 seconds',
    'send 3 heart reaction emojis in the game right now',
    'say "You are the coolest person in this room"',
    'show your favorite happy dance for 5 seconds',
    'give your best sweet movie confession line in 10 seconds',
    'tell me 1 cute thing you would do if we met in person today',
    'say "I promise to be on my best behavior!" with a smile',
    'do a slow-motion dramatic wave to the camera',
    'say "You always have the best energy" with a smile'
  ];

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    for (let d = 0; d < dareTemplates.length; d++) {
      const cat = dareCategories[(i * dareTemplates.length + d) % dareCategories.length];
      const diff = difficulties[(i + d) % difficulties.length];
      const text = dareTemplates[d](act);
      dares.push({
        id: `d_${dareId++}`,
        type: 'dare',
        category: cat,
        difficulty: diff,
        text
      });
    }
  }

  return { truths, dares };
}

const { truths, dares } = generateCleanQuestions();

const dataDir = path.join(__dirname, 'server', 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(path.join(dataDir, 'truths.json'), JSON.stringify(truths, null, 2), 'utf-8');
fs.writeFileSync(path.join(dataDir, 'dares.json'), JSON.stringify(dares, null, 2), 'utf-8');

console.log(`Generated ${truths.length} Simple Flirty Truths and ${dares.length} Simple Flirty Dares (Total: ${truths.length + dares.length})!`);
