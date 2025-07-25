import { useState, useEffect, useMemo } from 'react';

// CHARACTER DETECTION SYSTEM:
// - Rule-based detection: Optimized for story characters, handles dialogue, actions, possessives
// - Enhanced place filtering: Excludes locations like "London", "Castle Rock", "The Forest", etc.
// - Comprehensive blacklists and smart deduplication

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
  // This is optimized for story character detection and works better than NLP-based approaches
  // Features:
  //   - Dialogue detection: "Hello," John said.
  //   - Action detection: Sarah walked into the room.
  //   - Possessive detection: Mary's house was big.
  //   - Frequency filtering: Names mentioned 3+ times auto-detected
  //   - Place name filtering: Excludes locations like "London", "Castle Rock", etc.
  //   - Smart deduplication: Merges "Prince Harlan" + "Harlan" → "Prince Harlan"
  //   - Presence vs mention: Distinguishes active participants from passive mentions
  // To fine-tune:
  //   - Adjust NON_NAME_WORDS blacklist above for words incorrectly detected as names
  //   - Modify dialogue patterns (line ~465) to catch different speech patterns
  //   - Change frequency threshold (line ~510: "count >= 3") for auto-detection
  //   - Update action patterns (line ~525) for character actions
  //   - Enhance isLikelyPlaceName() above to catch more location patterns
  //   - Adjust presence scoring in getCharacterPresenceScore() to refine participant detection
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

function CharacterThreadVisualization({
  chapters,
  characters,
  characterDetectionBlacklist = [],
  onUpdateCharacterDetectionBlacklist
}) {
  const [selectedCharacters, setSelectedCharacters] = useState(new Set());
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [excludedCharacters, setExcludedCharacters] = useState(
    new Set(characterDetectionBlacklist)
  );
  const [showExcluded, setShowExcluded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [filterMentions, setFilterMentions] = useState(true); // New: toggle for presence filtering
  const [presenceThreshold, setPresenceThreshold] = useState(2.0); // New: adjustable threshold

  // Handle window resize for responsive width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Analyze character presence using rule-based detection
  const analysis = useMemo(() => {
    return CharacterAnalyzer.analyzeCharacterPresence(
      chapters,
      characters,
      characterDetectionBlacklist,
      filterMentions,
      presenceThreshold
    );
  }, [
    chapters,
    characters,
    characterDetectionBlacklist,
    filterMentions,
    presenceThreshold
  ]);

  const { characterPresence, _allDetectedCharacters } = analysis;

  // Get all scenes in order
  const allScenes = useMemo(() => {
    const scenes = [];
    chapters.forEach((chapter, chapterIndex) => {
      chapter.scenes.forEach((scene, sceneIndex) => {
        scenes.push({
          key: `${chapterIndex}-${sceneIndex}`,
          chapter: chapterIndex,
          scene: sceneIndex,
          chapterTitle: chapter.title,
          sceneTitle: scene.title,
          index: scenes.length
        });
      });
    });
    return scenes;
  }, [chapters]);

  // Filter characters based on selection and exclusions
  const visibleCharacters = useMemo(() => {
    const chars = Array.from(characterPresence.entries())
      .filter(([name, data]) => {
        // Don't show excluded characters (unless we're showing excluded ones)
        if (!showExcluded && excludedCharacters.has(name)) {
          return false;
        }
        if (showExcluded && !excludedCharacters.has(name)) {
          return false;
        }

        if (showOnlySelected && selectedCharacters.size > 0) {
          return selectedCharacters.has(name);
        }
        // Show characters that appear in scenes OR are from the formal character list
        return data.scenes.size > 0 || data.isFromCharacterList;
      })
      .sort(([_nameA, dataA], [_nameB, dataB]) => {
        // Sort by: formal characters first, then by frequency of appearances
        if (dataA.isFromCharacterList && !dataB.isFromCharacterList) return -1;
        if (!dataA.isFromCharacterList && dataB.isFromCharacterList) return 1;
        return dataB.scenes.size - dataA.scenes.size;
      });

    return chars;
  }, [
    characterPresence,
    selectedCharacters,
    showOnlySelected,
    excludedCharacters,
    showExcluded
  ]);

  // Generate colors for characters
  const characterColors = useMemo(() => {
    const colors = [
      '#2563eb',
      '#dc2626',
      '#059669',
      '#7c3aed',
      '#ea580c',
      '#0891b2',
      '#c2410c',
      '#9333ea',
      '#0d9488',
      '#b91c1c',
      '#4338ca',
      '#16a34a',
      '#ca8a04',
      '#be185d',
      '#0369a1'
    ];

    const colorMap = new Map();
    visibleCharacters.forEach(([name], index) => {
      colorMap.set(name, colors[index % colors.length]);
    });

    return colorMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCharacters, windowWidth]); // Include windowWidth for responsive recalculation

  // Spacing constants for compact layout
  const maxSceneSpacing = 60; // Maximum spacing between scenes
  const minSceneSpacing = 25; // Minimum spacing to maintain readability
  const leftMargin = 180;
  const rightMargin = 50;
  const topMargin = 60;
  const bottomMargin = 50;

  // SVG dimensions - fit content precisely to avoid unnecessary scrollbars
  const availableWidth = Math.max(400, windowWidth - 300); // Account for sidebar and padding
  const actualScenesWidth =
    allScenes.length > 1
      ? (allScenes.length - 1) *
          Math.max(minSceneSpacing, Math.min(maxSceneSpacing, 50)) +
        leftMargin +
        rightMargin +
        20
      : leftMargin + rightMargin + 150; // Fallback width for 0-1 scenes
  const width = Math.min(actualScenesWidth, availableWidth); // Fit within available space
  const baseHeight = Math.min(
    600,
    Math.max(400, visibleCharacters.length * 30 + 120)
  );
  const height = baseHeight;

  const plotWidth = width - leftMargin - rightMargin;
  const plotHeight = height - topMargin - bottomMargin;

  // Calculate positions with compact scene spacing
  const calculatedSpacing =
    allScenes.length > 1
      ? Math.min(maxSceneSpacing, plotWidth / Math.max(allScenes.length - 1, 1))
      : plotWidth / 2;
  const sceneSpacing = Math.max(minSceneSpacing, calculatedSpacing);

  const characterSpacing =
    visibleCharacters.length > 1
      ? plotHeight / (visibleCharacters.length - 1)
      : plotHeight / 2;

  const toggleCharacterSelection = characterName => {
    const newSelection = new Set(selectedCharacters);
    if (newSelection.has(characterName)) {
      newSelection.delete(characterName);
    } else {
      newSelection.add(characterName);
    }
    setSelectedCharacters(newSelection);
  };

  const clearSelection = () => {
    setSelectedCharacters(new Set());
  };

  const toggleCharacterExclusion = characterName => {
    const newExcluded = new Set(excludedCharacters);
    if (newExcluded.has(characterName)) {
      newExcluded.delete(characterName);
    } else {
      newExcluded.add(characterName);
      // Also remove from selection if excluded
      const newSelection = new Set(selectedCharacters);
      newSelection.delete(characterName);
      setSelectedCharacters(newSelection);
    }
    setExcludedCharacters(newExcluded);

    // Persist to parent component and book data
    if (onUpdateCharacterDetectionBlacklist) {
      onUpdateCharacterDetectionBlacklist(Array.from(newExcluded));
    }
  };

  const clearExclusions = () => {
    setExcludedCharacters(new Set());
    // Persist to parent component and book data
    if (onUpdateCharacterDetectionBlacklist) {
      onUpdateCharacterDetectionBlacklist([]);
    }
  };

  if (visibleCharacters.length === 0) {
    return (
      <div
        className="character-threads"
        style={{
          padding: '2rem',
          textAlign: 'center',
          height: '100%',
          maxHeight: '800px',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <h3>Character Thread Analysis</h3>
        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '2px dashed #d1d5db',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              margin: '0 0 1rem 0',
              fontSize: '1.1em',
              color: '#374151'
            }}
          >
            No characters detected yet.
          </p>
          <div
            style={{ fontSize: '0.9em', color: '#6b7280', textAlign: 'left' }}
          >
            <p>
              <strong>To get character detection working:</strong>
            </p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>
                <strong>Add characters to your character list</strong> - they'll
                appear here immediately
              </li>
              <li>
                <strong>Write character dialogue:</strong> "Hello," John said.
              </li>
              <li>
                <strong>Write character actions:</strong> Dave walked in, Sarah
                looked around
              </li>
              <li>
                <strong>Use possessive forms:</strong> Mary's house, Tom's idea
              </li>
              <li>
                <strong>Names mentioned 3+ times</strong> in a scene are
                auto-detected
              </li>
            </ul>
            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.8em',
                fontStyle: 'italic'
              }}
            >
              💡 The system automatically excludes locations like "London" or
              "Castle Rock"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="character-threads"
      style={{
        padding: '1.5rem',
        height: '100%',
        maxHeight: '800px', // Constrain height to enable scrolling
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', flexShrink: 0 }}>
        Character Thread Analysis
      </h3>

      {/* Controls */}
      <div
        style={{
          marginBottom: '1rem',
          flexShrink: 0,
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          fontSize: '0.9em'
        }}
      >
        <button
          onClick={() => setShowOnlySelected(!showOnlySelected)}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.8rem',
            backgroundColor: showOnlySelected ? '#2563eb' : '#f3f4f6',
            color: showOnlySelected ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          {showOnlySelected ? 'Show All' : 'Show Selected Only'}
        </button>

        {selectedCharacters.size > 0 && (
          <button
            onClick={clearSelection}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Clear Selection ({selectedCharacters.size})
          </button>
        )}

        {excludedCharacters.size > 0 && (
          <button
            onClick={() => setShowExcluded(!showExcluded)}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: showExcluded ? '#dc2626' : '#f3f4f6',
              color: showExcluded ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            {showExcluded
              ? `Hide Excluded (${excludedCharacters.size})`
              : `Show Excluded (${excludedCharacters.size})`}
          </button>
        )}

        {excludedCharacters.size > 0 && (
          <button
            onClick={clearExclusions}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Restore All
          </button>
        )}

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#6b7280'
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <input
              type="checkbox"
              checked={filterMentions}
              onChange={e => setFilterMentions(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span title="Filter out characters who are only mentioned vs actually present">
              Filter mentions
            </span>
          </label>
          {filterMentions && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Threshold:</span>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={presenceThreshold}
                onChange={e => setPresenceThreshold(parseFloat(e.target.value))}
                style={{ width: '60px' }}
                title={`Presence threshold: ${presenceThreshold} (higher = stricter filtering)`}
              />
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                {presenceThreshold}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable visualization area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#fafafa'
        }}
      >
        <svg width={width} height={height} style={{ display: 'block' }}>
          {/* Background */}
          <rect width={width} height={height} fill="#fafafa" />

          {/* Scene columns background */}
          {allScenes.map((scene, index) => {
            const x = leftMargin + index * sceneSpacing;
            return (
              <rect
                key={scene.key}
                x={x - 15}
                y={topMargin}
                width={30}
                height={plotHeight}
                fill={index % 2 === 0 ? '#ffffff' : '#f8f9fa'}
                opacity={0.7}
              />
            );
          })}

          {/* Character thread lines */}
          {visibleCharacters.map(([characterName, data], charIndex) => {
            const y = topMargin + charIndex * characterSpacing;
            const color = characterColors.get(characterName);
            const isSelected = selectedCharacters.has(characterName);
            const isHovered = hoveredCharacter === characterName;
            const opacity =
              selectedCharacters.size === 0 || isSelected ? 1 : 0.3;
            const strokeWidth =
              isSelected || isHovered
                ? 3
                : Math.max(1, Math.min(4, data.scenes.size));

            // Get scene positions for this character
            const scenePositions = [];
            allScenes.forEach((scene, sceneIndex) => {
              if (data.scenes.has(scene.key)) {
                scenePositions.push({
                  x: leftMargin + sceneIndex * sceneSpacing,
                  sceneKey: scene.key,
                  strength: data.scenes.get(scene.key).strength
                });
              }
            });

            // Draw connecting lines between appearances
            const lines = [];
            for (let i = 0; i < scenePositions.length - 1; i++) {
              const x1 = scenePositions[i].x;
              const x2 = scenePositions[i + 1].x;

              lines.push(
                <line
                  key={`${characterName}-line-${i}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                />
              );
            }

            return lines;
          })}

          {/* Character appearance dots */}
          {visibleCharacters.map(([characterName, data], charIndex) => {
            const y = topMargin + charIndex * characterSpacing;
            const color = characterColors.get(characterName);
            const isSelected = selectedCharacters.has(characterName);
            const isHovered = hoveredCharacter === characterName;
            const opacity =
              selectedCharacters.size === 0 || isSelected ? 1 : 0.3;

            return allScenes.map((scene, sceneIndex) => {
              if (!data.scenes.has(scene.key)) return null;

              const x = leftMargin + sceneIndex * sceneSpacing;
              const sceneData = data.scenes.get(scene.key);
              const dotSize = Math.max(3, Math.min(8, sceneData.strength * 2));

              return (
                <circle
                  key={`${characterName}-dot-${scene.key}`}
                  cx={x}
                  cy={y}
                  r={dotSize}
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected || isHovered ? '#ffffff' : color}
                  strokeWidth={isSelected || isHovered ? 2 : 1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredCharacter(characterName)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                >
                  <title>{`${characterName} in ${scene.chapterTitle} - ${scene.sceneTitle}\nStrength: ${sceneData.strength}`}</title>
                </circle>
              );
            });
          })}

          {/* Character labels */}
          {visibleCharacters.map(([characterName, data], charIndex) => {
            const y = topMargin + charIndex * characterSpacing;
            const color = characterColors.get(characterName);
            const isSelected = selectedCharacters.has(characterName);
            const isHovered = hoveredCharacter === characterName;
            const isFromList = data.isFromCharacterList;
            const opacity =
              selectedCharacters.size === 0 || isSelected ? 1 : 0.6;

            return (
              <g key={`${characterName}-label`}>
                <text
                  x={leftMargin - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill={color}
                  opacity={opacity}
                  fontWeight={
                    isSelected || isHovered
                      ? 'bold'
                      : isFromList
                        ? '600'
                        : 'normal'
                  }
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCharacterSelection(characterName)}
                  onMouseEnter={() => setHoveredCharacter(characterName)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                >
                  {isFromList ? '✓' : ''} {characterName} ({data.scenes.size})
                </text>

                {/* Exclude button */}
                <text
                  x={leftMargin - 165}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#dc2626"
                  opacity={isHovered ? 1 : 0.6}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCharacterExclusion(characterName)}
                  onMouseEnter={() => setHoveredCharacter(characterName)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                >
                  ✕
                </text>
              </g>
            );
          })}

          {/* Scene labels */}
          {allScenes.map((scene, index) => {
            const x = leftMargin + index * sceneSpacing;
            return (
              <g key={`scene-label-${scene.key}`}>
                {/* Chapter title (only on first scene of chapter) */}
                {(index === 0 ||
                  allScenes[index - 1].chapter !== scene.chapter) && (
                  <text
                    x={x}
                    y={topMargin - 35}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#374151"
                  >
                    {scene.chapterTitle}
                  </text>
                )}

                {/* Scene title */}
                <text
                  x={x}
                  y={topMargin - 25}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9ca3af"
                  transform={`rotate(-45, ${x}, ${topMargin - 25})`}
                >
                  {scene.sceneTitle || `Scene ${scene.scene + 1}`}
                </text>

                {/* Scene separator line */}
                <line
                  x1={x}
                  y1={topMargin}
                  x2={x}
                  y2={height - bottomMargin}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer info */}
      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.9em',
          color: '#6b7280',
          flexShrink: 0
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Usage:</strong> Click character names to select/highlight.
          Thread thickness shows appearance frequency. Hover for scene details.
          Use ✕ to permanently exclude false positives.
          {filterMentions &&
            ' Filtering enabled to show only active scene participants.'}
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8em' }}>
          <strong>Stats:</strong> {visibleCharacters.length} characters,{' '}
          {allScenes.length} scenes
          {allScenes.length > 10 &&
            ' • Compact layout optimized for long books'}
          {filterMentions && ` • Presence threshold: ${presenceThreshold}`}
        </p>
      </div>
    </div>
  );
}

export default CharacterThreadVisualization;
