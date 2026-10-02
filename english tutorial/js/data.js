// Static content: conversation scenarios, IELTS question bank, level test, pronunciation drills.
window.TutorData = {
  // Languages the learner can practise when "Multiple languages" is on. English uses the Accent setting for speech.
  languages: [
    { code: 'en', name: 'English', native: 'English', speech: null },
    { code: 'es', name: 'Spanish', native: 'Español', speech: 'es-ES', sample: '¡Hola! Así sonaré cuando practiquemos español juntos.' },
    { code: 'fr', name: 'French', native: 'Français', speech: 'fr-FR', sample: 'Bonjour ! Voici comment je parlerai quand nous pratiquerons le français ensemble.' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', speech: 'hi-IN', sample: 'नमस्ते! जब हम साथ में हिंदी का अभ्यास करेंगे, तब मैं ऐसे बोलूँगी।' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', speech: 'mr-IN', voiceFallback: 'hi', sample: 'नमस्कार! आपण एकत्र मराठीचा सराव करू तेव्हा मी अशी बोलेन.' }
  ],

  scenarios: [
    {
      id: 'free', icon: '💬', title: 'Free Talk', tag: 'Daily',
      desc: 'Chat about anything you like. Your tutor keeps the conversation flowing.',
      role: 'a warm, curious English conversation partner who talks about anything the learner wants',
      opener: "Hi there! I'm your English speaking partner. What would you like to talk about today?"
    },
    {
      id: 'daily', icon: '☀️', title: 'Daily Life', tag: 'Daily',
      desc: 'Talk about your day, routines, family, food and weekend plans.',
      role: 'a friendly neighbour making small talk about daily life, routines, family, food and plans',
      opener: "Hey, good to see you! How has your day been so far?"
    },
    {
      id: 'cafe', icon: '☕', title: 'At a Café', tag: 'Daily',
      desc: 'Order drinks and food, ask about the menu, handle a mix-up.',
      role: 'a cheerful barista at a busy coffee shop taking the learner\'s order; occasionally add a small realistic complication (an item is sold out, a size question)',
      opener: "Hi, welcome in! What can I get started for you today?"
    },
    {
      id: 'travel', icon: '✈️', title: 'Airport & Hotel', tag: 'Travel',
      desc: 'Check in for a flight, go through immigration, book a hotel room.',
      role: 'an airline check-in agent, and later a hotel receptionist, helping the learner on a trip abroad',
      opener: "Good morning! Can I see your passport, please? Where are you flying to today?"
    },
    {
      id: 'doctor', icon: '🩺', title: 'Doctor Visit', tag: 'Daily',
      desc: 'Describe symptoms, answer questions and understand advice.',
      role: 'a kind general practitioner asking the learner about their symptoms and giving simple advice',
      opener: "Hello, please have a seat. So, what brings you in today?"
    },
    {
      id: 'meeting', icon: '📊', title: 'Business Meeting', tag: 'Work',
      desc: 'Give a status update, share opinions, agree and disagree politely.',
      role: 'a team manager running a weekly project meeting; ask the learner for updates, opinions, and push back politely sometimes',
      opener: "Okay, let's get started. Could you give us a quick update on your part of the project?"
    },
    {
      id: 'colleague', icon: '🤝', title: 'Office Small Talk', tag: 'Work',
      desc: 'Chat with a colleague in the break room, network at an event.',
      role: 'a friendly colleague making small talk in the office kitchen or at a networking event',
      opener: "Oh hi! I don't think we've properly met yet. Which team are you on?"
    },
    {
      id: 'interview', icon: '💼', title: 'Job Interview', tag: 'Work',
      desc: 'A realistic interview simulator for any role, with tough follow-ups.',
      input: { label: 'Which job are you interviewing for?', placeholder: 'e.g. Software Engineer, Nurse, Sales Manager' },
      role: 'a professional hiring manager interviewing the learner for the position of {input}. Ask ONE question at a time: a mix of behavioural ("Tell me about a time..."), situational and role-specific questions. Briefly react to each answer and ask a follow-up if the answer was vague. After about 7 questions, thank them and invite their questions',
      opener: "Hello, thanks for coming in today. To start, could you tell me a little about yourself and why you're interested in this {input} role?"
    },
    {
      id: 'presentation', icon: '🎤', title: 'Pitch & Present', tag: 'Work',
      desc: 'Present an idea or product and answer audience questions.',
      role: 'an audience member / investor listening to the learner present an idea, product or project, asking clarifying and challenging questions',
      opener: "Thanks for having us. We're excited to hear your idea. What are you presenting today, and what problem does it solve?"
    },
    {
      id: 'debate', icon: '⚖️', title: 'Opinion Debate', tag: 'Fluency',
      desc: 'Defend your opinion on a topic. Great for IELTS Part 3 style answers.',
      role: 'a friendly debate partner who picks interesting everyday topics (technology, education, environment, work) and politely takes the opposite side to make the learner justify their views',
      opener: "Let's have a friendly debate! Here's the first topic: some people say working from home is better than working in an office. What do you think, and why?"
    },
    {
      id: 'phone', icon: '📞', title: 'Customer Service Call', tag: 'Daily',
      desc: 'Complain about a problem, ask for a refund, solve an issue by phone.',
      role: 'a customer service agent on the phone; the learner has a problem with a product or service they bought',
      opener: "Thank you for calling customer support, my name is Alex. How can I help you today?"
    },
    {
      id: 'custom', icon: '✨', title: 'Custom Role-play', tag: 'Any',
      desc: 'Describe any situation and the tutor will play the other person.',
      input: { label: 'Describe the situation', placeholder: 'e.g. Negotiating rent with my landlord' },
      role: 'the other person in this role-play situation: "{input}". Stay fully in character',
      opener: "Alright, let's begin our role-play: {input}. I'll start. Hello!"
    }
  ],

  ielts: {
    part1: [
      { topic: 'your hometown', questions: ['Where is your hometown?', 'What do you like most about your hometown?', 'Has your hometown changed much since you were a child?', 'Would you like to live there in the future?'] },
      { topic: 'work or studies', questions: ['Do you work or are you a student?', 'Why did you choose that job or subject?', 'What is the most difficult part of your work or studies?', 'What would you like to do in the future?'] },
      { topic: 'your home', questions: ['Do you live in a house or an apartment?', 'Which room do you spend the most time in?', 'What would you like to change about your home?', 'Do you plan to live there for a long time?'] },
      { topic: 'hobbies', questions: ['What do you like to do in your free time?', 'Did you have the same hobbies when you were a child?', 'Do you prefer spending free time alone or with others?', 'Is there a new hobby you would like to try?'] },
      { topic: 'music', questions: ['What kind of music do you enjoy?', 'When do you usually listen to music?', 'Have you ever learned to play a musical instrument?', 'Do you think music is important for children?'] },
      { topic: 'food', questions: ['What is your favourite food?', 'Do you prefer eating at home or eating out?', 'Can you cook?', 'Has your diet changed in recent years?'] },
      { topic: 'mobile phones', questions: ['How often do you use your mobile phone?', 'What do you mostly use it for?', 'Could you live without your phone for a week?', 'Do you think children should have mobile phones?'] },
      { topic: 'the weather', questions: ['What is the weather usually like where you live?', 'What is your favourite season?', 'Does the weather affect your mood?', 'Do you check the weather forecast often?'] },
      { topic: 'reading', questions: ['Do you like reading?', 'What kind of books do you read?', 'Do you prefer paper books or e-books?', 'Did you read a lot as a child?'] }
    ],
    part2: [
      {
        topic: 'helping others',
        card: 'Describe a time when you helped someone.',
        points: ['who you helped', 'what the situation was', 'how you helped them', 'and explain how you felt about it'],
        part3: ['Why do some people enjoy helping others?', 'Should schools teach children to help their community?', 'Do you think people help each other less than they did in the past?', 'What role should governments play in helping people in need?']
      },
      {
        topic: 'places',
        card: 'Describe a place you visited that you would like to go back to.',
        points: ['where it is', 'when you went there', 'what you did there', 'and explain why you would like to return'],
        part3: ['Why do people like to travel to new places?', 'How has tourism changed in your country?', 'What are the disadvantages of mass tourism?', 'Do you think virtual travel could ever replace real travel?']
      },
      {
        topic: 'skills',
        card: 'Describe a skill you learned that you think is important.',
        points: ['what the skill is', 'how and when you learned it', 'how difficult it was to learn', 'and explain why you think it is important'],
        part3: ['What skills are most important for young people today?', 'Is it better to learn skills at school or on the job?', 'How has technology changed the way people learn?', 'Will some skills become useless in the future?']
      },
      {
        topic: 'people',
        card: 'Describe a person who has influenced you.',
        points: ['who this person is', 'how you know them', 'what they have done', 'and explain how they have influenced you'],
        part3: ['What qualities make someone a good role model?', 'Do celebrities have a responsibility to be good role models?', 'Who influences young people more: parents or friends?', 'How has social media changed who young people admire?']
      },
      {
        topic: 'technology',
        card: 'Describe a piece of technology you find useful.',
        points: ['what it is', 'when you started using it', 'how often you use it', 'and explain why you find it useful'],
        part3: ['How has technology changed the way people communicate?', 'Are there any negative effects of technology on society?', 'Do older people find it harder to adapt to new technology? Why?', 'What technology do you think will be important in the future?']
      },
      {
        topic: 'goals',
        card: 'Describe a goal you would like to achieve in the future.',
        points: ['what the goal is', 'why you set this goal', 'what you need to do to achieve it', 'and explain how you would feel if you achieved it'],
        part3: ['Is it important for people to set goals?', 'Do young people today have different goals from their parents?', 'Why do some people give up on their goals?', 'Should success be measured by money?']
      },
      {
        topic: 'events',
        card: 'Describe a celebration or special event you enjoyed.',
        points: ['what the event was', 'when and where it took place', 'who was there', 'and explain why you enjoyed it'],
        part3: ['Why are traditional celebrations important?', 'How have celebrations changed in your country?', 'Do people spend too much money on celebrations?', 'Should companies organise events for their employees?']
      },
      {
        topic: 'the environment',
        card: 'Describe something you do to help protect the environment.',
        points: ['what you do', 'when you started doing it', 'why you do it', 'and explain how effective you think it is'],
        part3: ['Who is more responsible for protecting the environment: individuals or governments?', 'Why do some people not care about environmental problems?', 'How can children be taught to care about nature?', 'Is economic growth more important than protecting the environment?']
      }
    ]
  },

  levelTest: [
    { part: 'Question 1 of 5', q: 'Introduce yourself. Tell me your name, where you are from, and what you do.', prep: 0, speak: 45 },
    { part: 'Question 2 of 5', q: 'Describe your typical weekend. What do you usually do?', prep: 0, speak: 45 },
    { part: 'Question 3 of 5', q: 'Tell me about a memorable trip or experience you have had. What happened, and why do you remember it?', prep: 15, speak: 60 },
    { part: 'Question 4 of 5', q: 'Do you think technology makes people more connected or more isolated? Explain your opinion with examples.', prep: 15, speak: 60 },
    { part: 'Question 5 of 5', q: 'Some people believe success depends more on luck than on hard work. To what extent do you agree?', prep: 20, speak: 75 }
  ],

  pronunciation: [
    {
      id: 'th', title: 'TH sounds', tip: 'Put the tip of your tongue lightly between your teeth. "Think" is breathy (no voice); "this" is buzzy (with voice).',
      sentences: ['I think this is the third time this month.', 'They thanked their mother for the birthday gift.', 'There are three thousand things to think about.', 'Both brothers breathe through their mouths.', 'The weather is worse than they thought.']
    },
    {
      id: 'vw', title: 'V and W', tip: 'For V, touch your top teeth to your bottom lip and buzz. For W, round your lips like a kiss — teeth don\'t touch.',
      sentences: ['We visited a very wet village in winter.', 'What a wonderful view of the valley.', 'Vivian wore a violet vest on Wednesday.', 'Will you wait while I vacuum the van?', 'The vet was worried about the wild wolves.']
    },
    {
      id: 'rl', title: 'R and L', tip: 'For L, press your tongue tip behind your top teeth. For R, pull your tongue back without touching the roof of your mouth.',
      sentences: ['The red lorry rolled along the road.', 'Laura really loves reading long letters.', 'Please collect the correct files.', 'Light rain fell on the lonely river.', 'Larry\'s flight arrived late last Friday.']
    },
    {
      id: 'vowels', title: 'Short vs long vowels', tip: 'Long vowels (sheep, pool) are held longer with tense lips; short vowels (ship, pull) are quick and relaxed.',
      sentences: ['The sheep is on the ship.', 'Please sit in this seat.', 'I will leave it if you live here.', 'Pull the rope near the pool.', 'He was full of beans but the bin was full too.']
    },
    {
      id: 'endings', title: 'Word endings (-ed, -s)', tip: 'Don\'t drop final sounds! -ed can sound like /t/ (walked), /d/ (played) or /ɪd/ (wanted). -s can be /s/ or /z/.',
      sentences: ['She walked to work and played tennis afterwards.', 'He wanted to know where the books were.', 'My friends finished their projects yesterday.', 'The students asked several questions.', 'It costs six dollars and fifty cents.']
    },
    {
      id: 'business', title: 'Business English', tip: 'Speak clearly and stress the key content words. Pause briefly between ideas.',
      sentences: ['Could we schedule a follow-up meeting for next Thursday?', 'I would like to walk you through the quarterly results.', 'Let me clarify the main objectives of this project.', 'We need to prioritise the most urgent issues first.', 'Thank you for your time, I look forward to hearing from you.']
    },
    {
      id: 'linking', title: 'Linking & rhythm', tip: 'Native speakers link words together: "turn it off" sounds like "tur-ni-toff". Stress the important words and say small words quickly.',
      sentences: ['Turn it off and put it away.', 'What are you going to do about it?', 'I\'d like an apple and an orange.', 'Can I have a cup of tea, please?', 'Pick it up and take it outside.']
    }
  ],

  // Pronunciation drills for the other languages (English uses "pronunciation" above).
  // English is the base language: each sentence is [text, English meaning, how to say it in English letters].
  pronunciationByLang: {
    es: [
      {
        id: 'es-first', title: 'First words', tip: 'New to Spanish? Start here. Read the English meaning, tap Listen, then say it yourself.',
        sentences: [
          ['Hola', 'Hello', 'OH-lah'],
          ['Buenos días', 'Good morning', 'BWEH-nohs DEE-ahs'],
          ['Gracias', 'Thank you', 'GRAH-syahs'],
          ['Por favor', 'Please', 'pohr fah-BOHR'],
          ['Lo siento', 'I\'m sorry', 'loh SYEHN-toh'],
          ['Adiós', 'Goodbye', 'ah-DYOHS']
        ]
      },
      {
        id: 'es-basics', title: 'Everyday phrases', tip: 'Spanish vowels are short and pure: a, e, i, o, u always sound the same. Don\'t stretch them into glides.',
        sentences: [
          ['Hola, ¿cómo estás hoy?', 'Hello, how are you today?', 'OH-lah, KOH-moh ehs-TAHS oy?'],
          ['Me llamo Ana y vivo en Madrid.', 'My name is Ana and I live in Madrid.', 'meh YAH-moh AH-nah ee BEE-boh ehn mah-DREED'],
          ['Quiero un café con leche, por favor.', 'I would like a coffee with milk, please.', 'kee-EH-roh oon kah-FEH kohn LEH-cheh, pohr fah-BOHR'],
          ['¿Dónde está la estación de tren?', 'Where is the train station?', 'DOHN-deh ehs-TAH lah ehs-tah-SYOHN deh trehn?'],
          ['Mañana vamos a la playa con mis amigos.', 'Tomorrow we are going to the beach with my friends.', 'mah-NYAH-nah BAH-mohs ah lah PLAH-yah kohn mees ah-MEE-gohs']
        ]
      },
      {
        id: 'es-rr', title: 'R and RR', tip: 'A single r between vowels is one quick tap (pero). RR, and an r at the start of a word, is rolled (perro, rojo).',
        sentences: [
          ['El perro de Roberto corre rápido.', 'Roberto\'s dog runs fast.', 'ehl PEH-rroh deh rroh-BEHR-toh KOH-rreh RRAH-pee-doh'],
          ['Pero el perro es muy tranquilo.', 'But the dog is very calm.', 'PEH-roh ehl PEH-rroh ehs mwee trahn-KEE-loh'],
          ['La guitarra suena en la radio.', 'The guitar is playing on the radio.', 'lah gee-TAH-rrah SWEH-nah ehn lah RRAH-dyoh'],
          ['Rosa compra arroz en el mercado.', 'Rosa buys rice at the market.', 'RROH-sah KOHM-prah ah-RROHS ehn ehl mehr-KAH-doh'],
          ['Tres tristes tigres comen trigo.', 'Three sad tigers eat wheat.', 'trehs TREES-tehs TEE-grehs KOH-mehn TREE-goh']
        ]
      }
    ],
    fr: [
      {
        id: 'fr-first', title: 'First words', tip: 'New to French? Start here. Read the English meaning, tap Listen, then say it yourself.',
        sentences: [
          ['Bonjour', 'Hello / Good morning', 'bohn-ZHOOR'],
          ['Bonsoir', 'Good evening', 'bohn-SWAHR'],
          ['Merci', 'Thank you', 'mehr-SEE'],
          ['S\'il vous plaît', 'Please', 'seel voo PLAY'],
          ['Pardon', 'Sorry / Excuse me', 'pahr-DOHN'],
          ['Au revoir', 'Goodbye', 'oh ruh-VWAHR']
        ]
      },
      {
        id: 'fr-basics', title: 'Everyday phrases', tip: 'Final consonants are usually silent (petit, beaucoup). Link words smoothly and stress the last syllable of each group.',
        sentences: [
          ['Bonjour, comment allez-vous ?', 'Hello, how are you?', 'bohn-ZHOOR, koh-MAHN tah-lay VOO?'],
          ['Je m\'appelle Marie et j\'habite à Paris.', 'My name is Marie and I live in Paris.', 'zhuh mah-PEL mah-REE ay zhah-BEET ah pah-REE'],
          ['Je voudrais un croissant, s\'il vous plaît.', 'I would like a croissant, please.', 'zhuh voo-DRAY uhn krwah-SAHN, seel voo PLAY'],
          ['Où est la gare, s\'il vous plaît ?', 'Where is the train station, please?', 'oo ay lah GAHR, seel voo PLAY?'],
          ['Nous allons au cinéma ce soir.', 'We are going to the cinema tonight.', 'noo zah-LOHN oh see-nay-MAH suh SWAHR']
        ]
      },
      {
        id: 'fr-u-r', title: 'U, OU and the French R', tip: 'For "u" (tu), say "ee" with rounded lips. "ou" (tout) is like "oo". The French R comes from the back of the throat, like a soft gargle.',
        sentences: [
          ['Tu as vu la rue ?', 'Did you see the street?', 'tew ah vew lah rew?'],
          ['Où sont tous les jouets ?', 'Where are all the toys?', 'oo sohn too lay zhoo-AY?'],
          ['Le rat rentre rapidement.', 'The rat goes back in quickly.', 'luh rah RAHN-truh rah-peed-MAHN'],
          ['Il y a une voiture rouge dans la rue.', 'There is a red car in the street.', 'eel ee ah ewn vwah-TEWR roozh dahn lah rew'],
          ['Je trouve que tu es très sûr de toi.', 'I think you are very sure of yourself.', 'zhuh troov kuh tew ay tray sewr duh twah']
        ]
      }
    ],
    hi: [
      {
        id: 'hi-first', title: 'First words', tip: 'New to Hindi? Start here. Read the English meaning and the sound guide, tap Listen, then say it yourself.',
        sentences: [
          ['नमस्ते', 'Hello', 'namaste'],
          ['धन्यवाद', 'Thank you', 'dhanyavaad'],
          ['कृपया', 'Please', 'kripya'],
          ['माफ़ कीजिए', 'Sorry / Excuse me', 'maaf keejiye'],
          ['शुभ रात्रि', 'Good night', 'shubh raatri'],
          ['फिर मिलेंगे', 'See you again', 'phir milenge']
        ]
      },
      {
        id: 'hi-basics', title: 'Everyday phrases', tip: 'Hindi is read the way it is written. Keep vowels clear and give long vowels (आ, ई, ऊ) their full length.',
        sentences: [
          ['नमस्ते, आप कैसे हैं?', 'Hello, how are you?', 'namaste, aap kaise hain?'],
          ['मेरा नाम राहुल है और मैं दिल्ली में रहता हूँ।', 'My name is Rahul and I live in Delhi.', 'mera naam Rahul hai aur main Dilli mein rehta hoon'],
          ['मुझे एक कप चाय चाहिए।', 'I would like a cup of tea.', 'mujhe ek cup chaay chaahiye'],
          ['रेलवे स्टेशन कहाँ है?', 'Where is the railway station?', 'railway station kahaan hai?'],
          ['कल हम मंदिर जाएँगे।', 'Tomorrow we will go to the temple.', 'kal hum mandir jaayenge']
        ]
      },
      {
        id: 'hi-aspirated', title: 'Aspirated sounds', tip: 'Hindi separates plain and aspirated consonants. Hold a hand in front of your mouth: ख, फ, थ, भ release a puff of air; क, प, त, ब do not.',
        sentences: [
          ['खाना खाकर खेलने चलो।', 'After eating, let\'s go and play.', 'khaana khaakar khelne chalo'],
          ['फल और फूल बहुत सुंदर हैं।', 'The fruits and flowers are very beautiful.', 'phal aur phool bahut sundar hain'],
          ['थोड़ा पानी पी लो।', 'Drink a little water.', 'thoda paani pee lo'],
          ['भाई बाहर बगीचे में है।', 'Brother is outside in the garden.', 'bhaai baahar bageeche mein hai'],
          ['काम पूरा करके घर जाओ।', 'Finish the work and go home.', 'kaam poora karke ghar jaao']
        ]
      }
    ],
    mr: [
      {
        id: 'mr-first', title: 'First words', tip: 'New to Marathi? Start here. Read the English meaning and the sound guide, tap Listen, then say it yourself.',
        sentences: [
          ['नमस्कार', 'Hello', 'namaskaar'],
          ['धन्यवाद', 'Thank you', 'dhanyavaad'],
          ['कृपया', 'Please', 'krupayaa'],
          ['माफ करा', 'Sorry / Excuse me', 'maaf karaa'],
          ['शुभ सकाळ', 'Good morning', 'shubh sakaal'],
          ['पुन्हा भेटू', 'See you again', 'punhaa bhetoo']
        ]
      },
      {
        id: 'mr-basics', title: 'Everyday phrases', tip: 'Marathi uses the Devanagari script, like Hindi. Speak clearly and keep a steady, even rhythm.',
        sentences: [
          ['नमस्कार, तुम्ही कसे आहात?', 'Hello, how are you?', 'namaskaar, tumhi kase aahaat?'],
          ['माझे नाव सीमा आहे आणि मी पुण्यात राहते.', 'My name is Seema and I live in Pune.', 'maajhe naav Seema aahe aani mee Punyaat raahate'],
          ['मला एक कप चहा हवा आहे.', 'I would like a cup of tea.', 'mala ek cup chahaa havaa aahe'],
          ['रेल्वे स्टेशन कुठे आहे?', 'Where is the railway station?', 'railway station kuthe aahe?'],
          ['आज हवा खूप छान आहे.', 'The weather is very nice today.', 'aaj havaa khoop chhaan aahe']
        ]
      },
      {
        id: 'mr-retroflex', title: 'ळ and ण sounds', tip: 'ळ and ण are retroflex: curl the tip of your tongue back to touch the roof of your mouth. Compare ल/ळ and न/ण.',
        sentences: [
          ['बाळ शाळेत जाते.', 'The child goes to school.', 'baal shaalet jaate'],
          ['पाणी थंड आहे.', 'The water is cold.', 'paani thanda aahe'],
          ['कमळ पाण्यात फुलते.', 'The lotus blooms in water.', 'kamal paanyaat phulate'],
          ['आमच्या गावात खूप झाडे आहेत.', 'There are many trees in our village.', 'aamchya gaavaat khoop jhaade aahet'],
          ['तो रोज सकाळी फिरायला जातो.', 'He goes for a walk every morning.', 'to roj sakaali phiraayla jaato']
        ]
      }
    ]
  },

  fillers: ['um', 'uh', 'er', 'erm', 'ah', 'hmm', 'like', 'you know', 'i mean', 'basically', 'sort of', 'kind of', 'actually', 'literally']
};
