// Character detection and analysis utilities
const CharacterAnalyzer = {
  // Comprehensive blacklist of words that aren't character names
  NON_NAME_WORDS: new Set([
    // Pronouns
    'he',
    'she',
    'it',
    'they',
    'we',
    'you',
    'i',
    'me',
    'him',
    'her',
    'them',
    'us',
    'his',
    'hers',
    'its',
    'their',
    'our',
    'your',
    'my',
    'mine',
    'yours',
    'theirs',
    'ours',
    'himself',
    'herself',
    'itself',
    'themselves',
    'ourselves',
    'yourself',
    'yourselves',
    // Articles and determiners
    'the',
    'a',
    'an',
    'this',
    'that',
    'these',
    'those',
    'some',
    'any',
    'many',
    'much',
    'few',
    'several',
    'all',
    'both',
    'each',
    'every',
    'either',
    'neither',
    // Common conjunctions and prepositions
    'and',
    'or',
    'but',
    'so',
    'yet',
    'for',
    'nor',
    'with',
    'without',
    'to',
    'from',
    'in',
    'on',
    'at',
    'by',
    'of',
    'about',
    'under',
    'over',
    'through',
    'between',
    'among',
    'during',
    'before',
    'after',
    'since',
    'until',
    'while',
    'where',
    'when',
    'if',
    'as',
    'than',
    'like',
    'against',
    'upon',
    'within',
    'beneath',
    'beside',
    'beyond',
    // Time/place words
    'here',
    'there',
    'now',
    'then',
    'today',
    'tomorrow',
    'yesterday',
    'never',
    'always',
    'sometimes',
    'often',
    'usually',
    'rarely',
    'seldom',
    'once',
    'twice',
    'again',
    'still',
    'already',
    'just',
    'only',
    'even',
    'also',
    'too',
    'very',
    'quite',
    'rather',
    // Question words
    'what',
    'when',
    'where',
    'why',
    'who',
    'whom',
    'whose',
    'which',
    'how',
    // Common verbs that get capitalized at sentence start
    'was',
    'were',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'might',
    'may',
    'can',
    'must',
    'shall',
    'went',
    'came',
    'said',
    'told',
    'asked',
    'replied',
    'answered',
    'looked',
    'saw',
    'found',
    'made',
    'took',
    'gave',
    'got',
    'put',
    'turned',
    'walked',
    'ran',
    'let',
    'tell',
    'get',
    'take',
    'give',
    'make',
    'know',
    'think',
    'see',
    'want',
    'need',
    'feel',
    'seem',
    'become',
    'leave',
    'keep',
    'begin',
    'help',
    'show',
    'hear',
    'play',
    'move',
    'live',
    'bring',
    'happen',
    'write',
    'sit',
    'stand',
    'lose',
    'pay',
    'meet',
    'include',
    'continue',
    'set',
    'learn',
    'change',
    'lead',
    'understand',
    'watch',
    'follow',
    'stop',
    'create',
    'speak',
    'read',
    'spend',
    'grow',
    'open',
    'walk',
    'win',
    'teach',
    'offer',
    'remember',
    'consider',
    'appear',
    'buy',
    'serve',
    'die',
    'send',
    'expect',
    'build',
    'stay',
    'fall',
    'cut',
    'reach',
    'kill',
    'remain',
    'suggest',
    'raise',
    'pass',
    'sell',
    'decide',
    'return',
    'explain',
    'hope',
    'develop',
    'carry',
    'break',
    'receive',
    'agree',
    'support',
    'hit',
    'produce',
    'eat',
    'cover',
    'catch',
    'draw',
    'choose',
    'join',
    'attack',
    'argue',
    'smile',
    // Story/book structure words
    'chapter',
    'scene',
    'part',
    'book',
    'story',
    'tale',
    'end',
    'beginning',
    'middle',
    // Common adjectives that get capitalized
    'good',
    'bad',
    'big',
    'small',
    'old',
    'new',
    'young',
    'long',
    'short',
    'high',
    'low',
    'hot',
    'cold',
    'warm',
    'cool',
    'dark',
    'light',
    'bright',
    'heavy',
    'easy',
    'hard',
    'soft',
    'fast',
    'slow',
    'quick',
    'deep',
    'shallow',
    'wide',
    'narrow',
    'thick',
    'thin',
    'strong',
    'weak',
    'clean',
    'dirty',
    'rich',
    'poor',
    'full',
    'empty',
    'loud',
    'quiet',
    'beautiful',
    'ugly',
    'happy',
    'sad',
    'angry',
    'calm',
    'wild',
    'free',
    'busy',
    'ready',
    'sure',
    'real',
    'true',
    'false',
    'right',
    'wrong',
    'early',
    'late',
    'far',
    'near',
    'close',
    'open',
    'closed',
    'safe',
    'dangerous',
    // Common nouns that might be capitalized
    'people',
    'person',
    'man',
    'woman',
    'boy',
    'girl',
    'child',
    'children',
    'baby',
    'family',
    'mother',
    'father',
    'sister',
    'brother',
    'friend',
    'house',
    'home',
    'room',
    'door',
    'window',
    'table',
    'chair',
    'bed',
    'car',
    'road',
    'street',
    'city',
    'town',
    'country',
    'world',
    'water',
    'fire',
    'earth',
    'air',
    'sun',
    'moon',
    'star',
    'day',
    'night',
    'morning',
    'evening',
    'afternoon',
    'time',
    'year',
    'month',
    'week',
    'hour',
    'minute',
    'second',
    'moment',
    'life',
    'death',
    'love',
    'hate',
    'peace',
    'war',
    'hope',
    'fear',
    'joy',
    'sadness',
    'anger',
    'hand',
    'head',
    'eye',
    'face',
    'body',
    'heart',
    'mind',
    'voice',
    'word',
    'name',
    'place',
    'way',
    'side',
    'back',
    'front',
    'top',
    'bottom',
    'kind',
    'type',
    'sort',
    'part',
    'piece',
    'bit',
    'lot',
    'group',
    'team',
    'company',
    'business',
    'job',
    'work',
    'money',
    'power',
    'number',
    'point',
    'line',
    'area',
    'level',
    'order',
    'system',
    'government',
    'community',
    'society',
    'public',
    'service',
    'problem',
    'question',
    'answer',
    'reason',
    'idea',
    'fact',
    'information',
    'news',
    'case',
    'result',
    'change',
    'end',
    'start',
    'beginning',
    'middle',
    'example',
    'way',
    'method',
    // Numbers and basic counting
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'hundred',
    'thousand',
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'last',
    'next',
    'another',
    'other',
    'few',
    'many',
    'most',
    'more',
    'less',
    'much',
    'little',
    'enough',
    'several',
    // Modal and conditional words
    'don',
    'doesn',
    'won',
    'wouldn',
    'can',
    'cannot',
    'couldn',
    'shouldn',
    'mustn',
    'aren',
    'isn',
    'wasn',
    'weren',
    'haven',
    'hasn',
    'hadn',
    'didn',
    'doesn',
    // Fantasy/sci-fi terms that might not be names
    'magic',
    'spell',
    'sword',
    'dragon',
    'knight',
    'king',
    'queen',
    'prince',
    'princess',
    'lord',
    'lady',
    'sir',
    'master',
    'servant',
    'guard',
    'soldier',
    'captain',
    'general',
    'emperor',
    'empire',
    'kingdom',
    'castle',
    'tower',
    'forest',
    'mountain',
    'river',
    'sea',
    'ocean',
    'island',
    'desert',
    'valley',
    'harbour',
    'harbor',
    'bay',
    'coast',
    'shore',
    'beach',
    'cliff',
    'hill',
    'plain',
    'field',
    'meadow',
    'wood',
    'tree',
    'stone',
    'rock',
    'gold',
    'silver',
    'iron',
    'steel',
    'weapon',
    'armor',
    'shield',
    'bow',
    'arrow',
    'spear',
    'axe',
    'hammer',
    'crown',
    'throne',
    'palace',
    'temple',
    'church',
    'hall',
    'chamber',
    'dungeon',
    'gate',
    'wall',
    'bridge',
    'road',
    'path',
    'trail',
    'journey',
    'quest',
    'adventure',
    'battle',
    'fight',
    'war',
    'peace',
    'victory',
    'defeat',
    'army',
    'force',
    'power',
    'magic',
    'spell',
    'charm',
    'curse',
    'blessing',
    'gift',
    'talent',
    'skill',
    'art',
    'craft',
    'trade',
    'merchant',
    'trader',
    'shop',
    'market',
    'inn',
    'tavern',
    // Additional words that might be capitalized but aren't names
    'true',
    'false',
    'maybe',
    'yes',
    'no',
    'indeed',
    'certainly',
    'perhaps',
    'anyway',
    'somehow',
    'somewhere',
    'something',
    'someone',
    'everyone',
    'everything',
    'everywhere',
    'anything',
    'anyone',
    'anywhere',
    'nothing',
    'nobody',
    'nowhere',
    'meanwhile',
    'however',
    'therefore',
    'otherwise',
    'nevertheless',
    'furthermore',
    'moreover',
    'besides',
    'instead',
    'rather',
    'although',
    'though',
    'unless',
    'because',
    'since',
    'while',
    'whereas',
    'whether',
    'either',
    'neither',
    'both',
    'not',
    'nor',
    'never',
    'always',
    'sometimes',
    'often',
    'usually',
    'rarely',
    'hardly',
    'barely',
    'almost',
    'quite',
    'rather',
    'pretty',
    'fairly',
    'really',
    'truly',
    'actually',
    'probably',
    'possibly',
    'certainly',
    'definitely',
    'absolutely',
    'completely',
    'totally',
    'entirely',
    'exactly',
    'precisely',
    'especially',
    'particularly',
    'generally',
    'usually',
    'normally',
    'typically',
    'basically',
    'essentially',
    'mainly',
    'mostly',
    'largely',
    'partly',
    'slightly',
    'somewhat',
    'rather',
    // Common location terms that could be capitalized
    'place',
    'places',
    'location',
    'locations',
    'area',
    'areas',
    'region',
    'regions',
    'district',
    'districts',
    'territory',
    'territories',
    'zone',
    'zones',
    'section',
    'sections',
    'north',
    'south',
    'east',
    'west',
    'northeast',
    'northwest',
    'southeast',
    'southwest',
    'upper',
    'lower',
    'inner',
    'outer',
    'central',
    'downtown',
    'uptown',
    'midtown',
    // Common story elements that aren't character names
    'prologue',
    'epilogue',
    'introduction',
    'conclusion',
    'appendix',
    'index',
    'contents',
    'acknowledgments',
    'dedication',
    'preface',
    'afterword',
    // Common greetings and exclamations that get capitalized
    'hello',
    'hi',
    'hey',
    'bye',
    'goodbye',
    'thanks',
    'thank',
    'please',
    'sorry',
    'excuse',
    'pardon',
    'wow',
    'oh',
    'ah',
    'um',
    'hmm',
    'well',
    'okay',
    'ok',
    'yes',
    'yeah',
    'yep',
    'nope',
    'stop',
    'wait',
    'come',
    'go',
    'look',
    'see',
    'aye',
    'nay',
    'indeed',
    'alas',
    'behold',
    'hark',
    'lo'
  ]),

  // Check if a word is likely a proper name
  isLikelyName(word) {
    if (!word || word.length < 2 || word.length > 25) return false;

    // Must start with capital letter
    if (!/^[A-Z]/.test(word)) return false;

    // Convert to lowercase for blacklist check
    const lowerWord = word.toLowerCase();

    // Check against blacklist
    if (this.NON_NAME_WORDS.has(lowerWord)) return false;

    // For multi-word names, check if they start with common words that shouldn't be part of names
    const words = word.split(/\s+/);
    if (words.length > 1) {
      const firstWord = words[0].toLowerCase();
      // Reject if starts with these very common words
      const commonStarters = new Set([
        'if',
        'as',
        'but',
        'when',
        'where',
        'while',
        'since',
        'because',
        'although',
        'though',
        'unless',
        'until',
        'after',
        'before',
        'during',
        'against',
        'upon',
        'with',
        'without',
        'through',
        'between',
        'among',
        'above',
        'below',
        'under',
        'over',
        'beside',
        'behind',
        'beyond',
        'within',
        'throughout',
        'across',
        'let',
        'tell',
        'get',
        'take',
        'give',
        'make',
        'see',
        'look',
        'come',
        'go',
        'not',
        'nor',
        'never',
        'always',
        'sometimes',
        'often',
        'usually',
        'rarely',
        'just',
        'only',
        'even',
        'also',
        'too',
        'very',
        'quite',
        'rather',
        'still',
        'already',
        'again',
        'once',
        'twice',
        'then',
        'now',
        'here',
        'there',
        'are',
        'were',
        'was',
        'been',
        'being',
        'have',
        'has',
        'had',
        'will',
        'would',
        'could',
        'should',
        'might',
        'may',
        'can',
        'must',
        'shall',
        'do',
        'does',
        'did',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'many',
        'much',
        'more',
        'most',
        'few',
        'several',
        'some',
        'any',
        'all',
        'both',
        'each',
        'every',
        'either',
        'neither',
        'another',
        'other',
        'such',
        'the',
        'a',
        'an',
        'this',
        'that',
        'these',
        'those'
      ]);

      if (commonStarters.has(firstWord)) {
        return false;
      }

      // Also reject if it's a title/descriptor combination
      const titleCombos = new Set([
        'young prince',
        'old king',
        'fair folk',
        'your grace',
        'my lord',
        'my lady',
        'dear sir',
        'good sir',
        'poor man',
        'old man',
        'young man',
        'good woman',
        'old woman',
        'young woman',
        'little girl',
        'little boy',
        'big man',
        'the king',
        'the queen',
        'the prince',
        'the princess',
        'the lord',
        'the lady',
        'the captain',
        'the general',
        'the commander',
        'the master',
        'the servant',
        'the guard',
        'the soldier',
        'the knight',
        'the wizard',
        'the witch',
        'the dragon',
        'the beast',
        'the monster',
        'the demon',
        'the angel',
        'the aelfin',
        'the folk',
        'the people',
        'the men',
        'the women',
        'the children'
      ]);

      if (titleCombos.has(lowerWord)) {
        return false;
      }

      // Multi-word names should have all words capitalized and be reasonable length
      if (!words.every(w => /^[A-Z][a-z]*$/.test(w)) || words.length > 3) {
        return false;
      }
    }

    // Additional heuristics
    // Names usually don't end with common suffixes
    if (/(?:ing|ed|er|est|ly|tion|sion|ness|ment|able|ible)$/i.test(word)) {
      return false;
    }

    // Names don't usually have numbers or special characters (except apostrophes)
    if (/[0-9]/.test(word)) return false;

    return true;
  },

  // Analyze the context around character names to determine if they're actively present or just mentioned
  getCharacterPresenceScore(content, name) {
    const _lowerName = name.toLowerCase();
    let presenceScore = 0;

    // Find all instances of the name in the content
    const nameRegex = new RegExp(`\\b${name}\\b`, 'gi');
    const matches = [...content.matchAll(nameRegex)];

    matches.forEach(match => {
      const index = match.index;
      const beforeText = content
        .substring(Math.max(0, index - 50), index)
        .toLowerCase();
      const afterText = content
        .substring(
          index + name.length,
          Math.min(content.length, index + name.length + 50)
        )
        .toLowerCase();
      const contextText = (
        beforeText +
        ' ' +
        name.toLowerCase() +
        ' ' +
        afterText
      ).toLowerCase();

      // HIGH PRESENCE INDICATORS (strongly suggest the character is present)

      // Direct dialogue attribution
      if (
        /\b(said|replied|asked|whispered|shouted|muttered|called|exclaimed|continued|added|interrupted|answered|responded|declared|announced|observed|remarked|noted|commented|stated|mentioned)\b/.test(
          afterText
        )
      ) {
        presenceScore += 3;
      }

      // Action verbs (character doing something)
      if (
        /\b(walked|ran|moved|went|came|entered|left|sat|stood|looked|watched|turned|opened|closed|grabbed|took|put|held|dropped|picked|stepped|climbed|jumped|fell|stopped|started|began|finished|continued|paused|waited|listened|heard|saw|noticed|realized|thought|wondered|remembered|forgot|decided|chose|tried|attempted|managed|failed|succeeded|smiled|frowned|nodded|shook|laughed|cried|sighed|breathed|blinked|stared|glanced|pointed|reached|touched|felt|pulled|pushed|lifted|carried|threw|caught)\b/.test(
          afterText
        )
      ) {
        presenceScore += 2;
      }

      // Possessive indicating immediate presence/action
      if (
        /['']s\s+(eyes?|hands?|face|head|voice|body|arms?|legs?|fingers?|hair|mouth|lips|smile|frown|expression|gaze|look|nod|shake|breath|sigh|laugh|cry|tear|movement|gesture|reaction|response)\b/.test(
          afterText
        )
      ) {
        presenceScore += 2;
      }

      // Character being directly addressed or interacted with
      if (/\b(to|at|with|towards?)\s/.test(beforeText)) {
        presenceScore += 1;
      }

      // MEDIUM PRESENCE INDICATORS

      // Character as subject of sentence
      if (
        index === 0 ||
        /[.!?]\s*$/.test(beforeText) ||
        /^\s*$/.test(beforeText)
      ) {
        presenceScore += 1;
      }

      // LOW PRESENCE INDICATORS (might just be mentions)

      // Basic frequency (being mentioned at all)
      presenceScore += 0.2;

      // NEGATIVE PRESENCE INDICATORS (suggest passive mention)

      // Character mentioned in past context
      if (
        /\b(about|regarding|concerning|remember|recalled|mentioned|told me about|heard about|spoke of|thought of|reminded of|story about|tale of)\s+/.test(
          beforeText
        )
      ) {
        presenceScore -= 1;
      }

      // Character in possessive context that suggests absence
      if (
        /['']s\s+(letter|message|note|book|story|house|room|belongings|things|stuff|property|work|job|family|parents|children|past|history|memory|dream|idea|plan|thoughts?)\b/.test(
          afterText
        )
      ) {
        presenceScore -= 0.5;
      }

      // Temporal indicators suggesting past/future
      if (
        /\b(yesterday|tomorrow|last week|next week|before|after|when he was|when she was|used to|will|would have|had been|years ago|months ago|days ago)\b/.test(
          contextText
        )
      ) {
        presenceScore -= 0.5;
      }
    });

    return Math.max(0, presenceScore); // Don't go negative
  },

  // Enhanced helper to identify likely place names vs person names
  isLikelyPlaceName(word) {
    const lowerWord = word.toLowerCase();

    // Geographic/location indicators within names
    const placeIndicators = [
      // Buildings & structures
      'castle',
      'tower',
      'fort',
      'fortress',
      'palace',
      'hall',
      'manor',
      'house',
      'keep',
      'temple',
      'church',
      'cathedral',
      'abbey',
      'monastery',
      'shrine',
      'sanctuary',
      'tavern',
      'inn',
      'pub',
      'lodge',
      'hostel',
      'market',
      'square',
      'plaza',
      'bridge',
      'gate',
      'wall',
      'arch',
      'port',
      'harbor',
      'harbour',
      'dock',
      'wharf',

      // Settlements
      'city',
      'town',
      'village',
      'hamlet',
      'settlement',
      'colony',
      'outpost',
      'kingdom',
      'empire',
      'realm',
      'domain',
      'duchy',
      'county',
      'shire',
      'province',
      'territory',
      'region',
      'district',
      'quarter',
      'ward',

      // Natural features
      'mountain',
      'mountains',
      'hill',
      'hills',
      'peak',
      'ridge',
      'cliff',
      'canyon',
      'valley',
      'glen',
      'dale',
      'hollow',
      'gorge',
      'pass',
      'gap',
      'forest',
      'wood',
      'woods',
      'grove',
      'thicket',
      'jungle',
      'wilderness',
      'river',
      'stream',
      'creek',
      'brook',
      'lake',
      'pond',
      'pool',
      'spring',
      'sea',
      'ocean',
      'bay',
      'gulf',
      'strait',
      'channel',
      'sound',
      'island',
      'isle',
      'archipelago',
      'atoll',
      'reef',
      'desert',
      'waste',
      'wasteland',
      'badlands',
      'moor',
      'heath',
      'bog',
      'marsh',
      'plain',
      'plains',
      'field',
      'fields',
      'meadow',
      'prairie',
      'steppe',
      'coast',
      'shore',
      'beach',
      'strand',
      'peninsula',
      'cape',
      'point',

      // Roads & paths
      'road',
      'street',
      'avenue',
      'lane',
      'way',
      'path',
      'trail',
      'route',
      'highway',
      'byway',
      'thoroughfare',
      'boulevard',
      'drive',
      'court',

      // Directional/geographic terms when part of place names
      'north',
      'south',
      'east',
      'west',
      'northern',
      'southern',
      'eastern',
      'western',
      'upper',
      'lower',
      'high',
      'low',
      'great',
      'little',
      'old',
      'new'
    ];

    // Check if the word contains any place indicators
    if (placeIndicators.some(indicator => lowerWord.includes(indicator))) {
      return true;
    }

    // Common place name suffixes
    const placeSuffixes = [
      'burg',
      'burgh',
      'berg',
      'boro',
      'borough',
      'shire',
      'ford',
      'ham',
      'ton',
      'ville',
      'stad',
      'stadt',
      'land',
      'lands',
      'feld',
      'field',
      'wick',
      'worth',
      'by',
      'haven',
      'port',
      'mouth',
      'head',
      'end',
      'side'
    ];

    // Check for place suffixes
    if (placeSuffixes.some(suffix => lowerWord.endsWith(suffix))) {
      return true;
    }

    // Pattern: "The [Something]" often indicates a place
    if (lowerWord.startsWith('the ') && word.split(' ').length <= 3) {
      return true;
    }

    // Pattern: Compass directions as standalone or with common place words
    const compassTerms = [
      'north',
      'south',
      'east',
      'west',
      'northeast',
      'northwest',
      'southeast',
      'southwest'
    ];
    if (compassTerms.includes(lowerWord)) {
      return true;
    }

    return false;
  },

  // Deduplicate character names (merge "Name" with "Title Name")
  deduplicateCharacters(characterPresence) {
    const entries = Array.from(characterPresence.entries());
    const toRemove = new Set();
    const _toMerge = new Map();

    // Common titles that indicate the same character
    const titles = [
      'prince',
      'king',
      'queen',
      'princess',
      'lord',
      'lady',
      'sir',
      'captain',
      'commander',
      'general',
      'master',
      'doctor',
      'dr',
      'mr',
      'mrs',
      'miss',
      'ms',
      'duke',
      'duchess',
      'earl',
      'baron',
      'count',
      'knight',
      'dame',
      'major',
      'colonel',
      'admiral',
      'sergeant',
      'lieutenant',
      'corporal',
      'private',
      'professor',
      'father',
      'mother',
      'brother',
      'sister',
      'elder',
      'young',
      'old',
      'saint',
      'elder',
      'thane',
      'archduke',
      'magistrate',
      'chancellor'
    ];

    // Check each character against all others for potential duplicates
    for (let i = 0; i < entries.length; i++) {
      const [nameA, dataA] = entries[i];

      for (let j = i + 1; j < entries.length; j++) {
        const [nameB, dataB] = entries[j];

        const lowerA = nameA.toLowerCase();
        const lowerB = nameB.toLowerCase();

        let keepName = null;
        let removeName = null;
        let keepData = null;
        let removeData = null;

        // Check if one name is contained in the other
        if (lowerA.includes(lowerB) && lowerA !== lowerB) {
          // nameA contains nameB (e.g., "Prince Morz" contains "Morz")
          // Check if it's a title situation
          const wordsA = nameA.toLowerCase().split(/\s+/);
          const wordsB = nameB.toLowerCase().split(/\s+/);

          // If nameA starts with a title and ends with nameB, they're the same person
          if (
            wordsA.length > wordsB.length &&
            titles.includes(wordsA[0]) &&
            wordsA.slice(-wordsB.length).join(' ') === wordsB.join(' ')
          ) {
            keepName = nameA;
            removeName = nameB;
            keepData = dataA;
            removeData = dataB;
          }
          // Also handle "First Last" vs "Last" cases
          else if (
            wordsA.length === 2 &&
            wordsB.length === 1 &&
            wordsA[1] === wordsB[0]
          ) {
            keepName = nameA; // Keep "First Last"
            removeName = nameB; // Remove "Last"
            keepData = dataA;
            removeData = dataB;
          }
        } else if (lowerB.includes(lowerA) && lowerA !== lowerB) {
          // nameB contains nameA (e.g., "Prince Harlan" contains "Harlan")
          const wordsB = nameB.toLowerCase().split(/\s+/);
          const wordsA = nameA.toLowerCase().split(/\s+/);

          if (
            wordsB.length > wordsA.length &&
            titles.includes(wordsB[0]) &&
            wordsB.slice(-wordsA.length).join(' ') === wordsA.join(' ')
          ) {
            keepName = nameB;
            removeName = nameA;
            keepData = dataB;
            removeData = dataA;
          }
          // Also handle "First Last" vs "First" cases
          else if (
            wordsB.length === 2 &&
            wordsA.length === 1 &&
            wordsB[0] === wordsA[0]
          ) {
            keepName = nameB; // Keep "First Last"
            removeName = nameA; // Remove "First"
            keepData = dataB;
            removeData = dataA;
          }
        }
        // Also check for exact word matches in different positions
        // e.g., "Galen" and "Galen Hardwine" should merge to "Galen Hardwine"
        else {
          const wordsA = nameA.toLowerCase().split(/\s+/);
          const wordsB = nameB.toLowerCase().split(/\s+/);

          // If one is a single word and the other contains it as a word
          if (
            wordsA.length === 1 &&
            wordsB.length > 1 &&
            wordsB.includes(wordsA[0])
          ) {
            keepName = nameB; // Keep the longer name
            removeName = nameA;
            keepData = dataB;
            removeData = dataA;
          } else if (
            wordsB.length === 1 &&
            wordsA.length > 1 &&
            wordsA.includes(wordsB[0])
          ) {
            keepName = nameA; // Keep the longer name
            removeName = nameB;
            keepData = dataA;
            removeData = dataB;
          }
        }

        // If we found a duplicate, merge them
        if (keepName && removeName) {
          toRemove.add(removeName);

          // Merge scene appearances
          removeData.scenes.forEach((sceneInfo, sceneKey) => {
            if (keepData.scenes.has(sceneKey)) {
              // If both appear in the same scene, combine their strength
              const existingInfo = keepData.scenes.get(sceneKey);
              existingInfo.strength += sceneInfo.strength;
            } else {
              // Add the scene appearance
              keepData.scenes.set(sceneKey, sceneInfo);
            }
          });

          // Prefer formal character list status if either has it
          if (removeData.isFromCharacterList) {
            keepData.isFromCharacterList = true;
          }
        }
      }
    }

    // Remove duplicates
    toRemove.forEach(name => {
      characterPresence.delete(name);
    });

    return characterPresence;
  },

  // Extract character names from scene content using rule-based detection
  extractCharacterNames(
    content,
    userBlacklist = [],
    filterMentions = true,
    threshold = 2.0
  ) {
    if (!content) return [];

    const names = new Set();

    // Create combined blacklist for this extraction
    const combinedBlacklist = new Set([
      ...this.NON_NAME_WORDS,
      ...userBlacklist.map(name => name.toLowerCase())
    ]);

    // First pass: collect all potential character names with their context
    const potentialCharacters = new Map(); // name -> presence score

    // Method 1: Look for dialogue patterns: "Name said", "Name replied", etc.
    const dialoguePattern =
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|replied|asked|whispered|shouted|muttered|called|exclaimed|continued|added|interrupted|nodded|smiled|laughed|sighed|frowned|shrugged|answered|responded|declared|announced|observed|remarked|noted|commented|stated|mentioned)(?:[.,!?]|\s|$)/gi;
    const dialogueMatches = content.match(dialoguePattern);
    if (dialogueMatches) {
      dialogueMatches.forEach(match => {
        const name = match
          .replace(
            /\s+(?:said|replied|asked|whispered|shouted|muttered|called|exclaimed|continued|added|interrupted|nodded|smiled|laughed|sighed|frowned|shrugged|answered|responded|declared|announced|observed|remarked|noted|commented|stated|mentioned)(?:[.,!?]|\s|$).*/gi,
            ''
          )
          .trim();
        if (
          this.isLikelyName(name) &&
          !combinedBlacklist.has(name.toLowerCase()) &&
          !this.isLikelyPlaceName(name)
        ) {
          const score = this.getCharacterPresenceScore(content, name);
          potentialCharacters.set(
            name,
            (potentialCharacters.get(name) || 0) + score
          );
        }
      });
    }

    // Method 2: Look for quoted dialogue followed by names
    const quotedDialoguePattern =
      /"[^"]*",?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|replied|asked|whispered|shouted|muttered|called|exclaimed|answered|responded|declared|announced|observed|remarked|noted|commented|stated|mentioned)(?:[.,!?]|\s|$)/gi;
    const quotedMatches = content.match(quotedDialoguePattern);
    if (quotedMatches) {
      quotedMatches.forEach(match => {
        const nameMatch = match.match(
          /",?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|replied|asked|whispered|shouted|muttered|called|exclaimed|answered|responded|declared|announced|observed|remarked|noted|commented|stated|mentioned)(?:[.,!?]|\s|$)/i
        );
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim();
          if (
            this.isLikelyName(name) &&
            !combinedBlacklist.has(name.toLowerCase()) &&
            !this.isLikelyPlaceName(name)
          ) {
            const score = this.getCharacterPresenceScore(content, name);
            potentialCharacters.set(
              name,
              (potentialCharacters.get(name) || 0) + score
            );
          }
        }
      });
    }

    // Method 3: Look for possessive forms: "John's", "Mary's"
    const possessivePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\s/g;
    const possessiveMatches = content.match(possessivePattern);
    if (possessiveMatches) {
      possessiveMatches.forEach(match => {
        const name = match.replace(/'s\s/, '').trim();
        if (
          this.isLikelyName(name) &&
          !combinedBlacklist.has(name.toLowerCase()) &&
          !this.isLikelyPlaceName(name)
        ) {
          const score = this.getCharacterPresenceScore(content, name);
          potentialCharacters.set(
            name,
            (potentialCharacters.get(name) || 0) + score
          );
        }
      });
    }

    // Method 4: Look for capitalized names that appear multiple times
    const capitalizedWords = content.match(
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g
    );
    if (capitalizedWords) {
      const wordCounts = {};
      capitalizedWords.forEach(word => {
        if (
          this.isLikelyName(word) &&
          !combinedBlacklist.has(word.toLowerCase()) &&
          !this.isLikelyPlaceName(word)
        ) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });

      // Add words that appear multiple times, with presence scoring
      Object.entries(wordCounts).forEach(([word, count]) => {
        if (count >= 2) {
          // Lowered from 3 since we'll filter by presence anyway
          const score = this.getCharacterPresenceScore(content, word);
          potentialCharacters.set(
            word,
            (potentialCharacters.get(word) || 0) + score
          );
        }
      });
    }

    // Method 5: Look for names in action contexts
    const actionPattern =
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:walked|ran|moved|went|came|entered|left|sat|stood|looked|watched|turned|opened|closed|grabbed|took|put|held|dropped|picked|called|shouted|whispered|smiled|frowned|nodded|shook|stepped|climbed|jumped|fell|stopped|started|began|finished|continued|paused|waited|listened|heard|saw|noticed|realized|thought|wondered|remembered|forgot|decided|chose|tried|attempted|managed|failed|succeeded)/gi;
    const actionMatches = content.match(actionPattern);
    if (actionMatches) {
      actionMatches.forEach(match => {
        const name = match
          .replace(
            /\s+(?:walked|ran|moved|went|came|entered|left|sat|stood|looked|watched|turned|opened|closed|grabbed|took|put|held|dropped|picked|called|shouted|whispered|smiled|frowned|nodded|shook|stepped|climbed|jumped|fell|stopped|started|began|finished|continued|paused|waited|listened|heard|saw|noticed|realized|thought|wondered|remembered|forgot|decided|chose|tried|attempted|managed|failed|succeeded).*/gi,
            ''
          )
          .trim();
        if (
          this.isLikelyName(name) &&
          !combinedBlacklist.has(name.toLowerCase()) &&
          !this.isLikelyPlaceName(name)
        ) {
          const score = this.getCharacterPresenceScore(content, name);
          potentialCharacters.set(
            name,
            (potentialCharacters.get(name) || 0) + score
          );
        }
      });
    }

    // Filter characters by presence score - only include those likely to be actually present
    if (filterMentions) {
      potentialCharacters.forEach((score, name) => {
        if (score >= threshold) {
          names.add(name);
        }
      });
    } else {
      // If filtering is disabled, add all potential characters
      potentialCharacters.forEach((score, name) => {
        names.add(name);
      });
    }

    return Array.from(names);
  },

  // Analyze character presence across all scenes using rule-based detection
  analyzeCharacterPresence(
    chapters,
    formalCharacters = [],
    userBlacklist = [],
    filterMentions = true,
    threshold = 2.0
  ) {
    const characterPresence = new Map();
    const allDetectedCharacters = new Set();

    // Add user blacklist to our filtering
    const combinedBlacklist = new Set([
      ...this.NON_NAME_WORDS,
      ...userBlacklist.map(name => name.toLowerCase())
    ]);

    // Add formal characters
    formalCharacters.forEach(char => {
      allDetectedCharacters.add(char.name);
      characterPresence.set(char.name, {
        scenes: new Map(),
        isFromCharacterList: true,
        avatar: char.avatar || '👤'
      });
    });

    // Analyze each scene
    chapters.forEach((chapter, chapterIndex) => {
      chapter.scenes.forEach((scene, sceneIndex) => {
        const sceneKey = `${chapterIndex}-${sceneIndex}`;

        // Use rule-based character detection with presence filtering
        const detectedNames = this.extractCharacterNames(
          scene.content,
          userBlacklist,
          filterMentions,
          threshold
        );

        detectedNames.forEach(name => {
          // Skip if name is in user blacklist
          if (combinedBlacklist.has(name.toLowerCase())) {
            return;
          }

          allDetectedCharacters.add(name);

          if (!characterPresence.has(name)) {
            characterPresence.set(name, {
              scenes: new Map(),
              isFromCharacterList: false,
              avatar: '👤'
            });
          }

          const characterData = characterPresence.get(name);
          characterData.scenes.set(sceneKey, {
            chapter: chapterIndex,
            scene: sceneIndex,
            chapterTitle: chapter.title,
            sceneTitle: scene.title,
            strength: detectedNames.filter(n => n === name).length // How often they appear in this scene
          });
        });
      });
    });

    // Deduplicate characters (merge "Name" with "Title Name")
    this.deduplicateCharacters(characterPresence);

    return {
      characterPresence,
      allDetectedCharacters: Array.from(characterPresence.keys())
    };
  }
};

export default CharacterAnalyzer;
