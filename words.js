/* words.js — simple words + close-but-different hints + anti-repeat (UK English)
   Integration:
     - Build your pool from selected categories (PACKS).
     - Get next word:  window.ImposterWords.nextWord(pool)
     - Optional hint:  window.ImposterWords.getHint(word)
*/

(function () {
  // ---------- Anti-repeat memory ----------
  const STORAGE_KEY = "imposter_used_words_v3";
  const STORAGE_MAX = 250;          // remember last N unique words
  const STORAGE_DAYS = 14;          // remember for N days

  function loadMem() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { list: [], map: {} };
      const data = JSON.parse(raw);
      const horizon = Date.now() - STORAGE_DAYS * 864e5;
      const list = data.list.filter(w => (data.map[w] || 0) >= horizon);
      const map = {};
      list.forEach(w => (map[w] = data.map[w]));
      return { list, map };
    } catch { return { list: [], map: {} }; }
  }
  function saveMem(mem) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mem)); } catch {}
  }
  function remember(word) {
    const mem = loadMem();
    const now = Date.now();
    mem.list = mem.list.filter(w => w !== word);
    mem.list.push(word);
    mem.map[word] = now;
    while (mem.list.length > STORAGE_MAX) {
      const drop = mem.list.shift();
      delete mem.map[drop];
    }
    saveMem(mem);
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

  // ---------- Packs (6 × 25 = 150 words) ----------
  const PACKS = {
    "Food & Drink": [
      "apple","banana","bread","butter","cake",
      "cheese","chicken","chips","chocolate","coffee",
      "egg","fish","jam","milk","orange",
      "pasta","pizza","rice","salad","salt",
      "sandwich","sauce","soup","sugar","tea"
    ],
    "Animals": [
      "ant","bear","bird","cat","chicken",
      "cow","deer","dog","dolphin","duck",
      "eagle","elephant","fish","fox","frog",
      "horse","lion","monkey","mouse","owl",
      "pig","rabbit","shark","sheep","tiger"
    ],
    "Places": [
      "airport","bank","beach","bridge","bus stop",
      "cafe","church","cinema","city","farm",
      "forest","hospital","hotel","island","library",
      "market","mountain","museum","office","park",
      "river","school","shop","station","town"
    ],
    "Objects & Things": [
      "bag","battery","book","bottle","broom",
      "brush","camera","chair","clock","comb",
      "cup","key","knife","ladder","lamp",
      "mirror","mobile","paper","pen","pencil",
      "pillow","plate","spoon","table","watch"
    ],
    "Sports & Games": [
      "badminton","basketball","bowling","boxing","chess",
      "cricket","cycling","darts","football","golf",
      "hockey","karate","rowing","rugby","running",
      "skating","skiing","snooker","surfing","swimming",
      "table tennis","tennis","volleyball","yoga","poker"
    ],
    "Movies & TV": [
      "actor","camera","cartoon","credits","director",
      "extra","film","hero","makeup","poster",
      "prop","scene","screen","script","set",
      "sound","studio","subtitle","theme","ticket",
      "title","trailer","villain","voice","wardrobe"
    ]
  };

  // ---------- Close-but-different hints ----------
  // Hints are associations, functions, or contexts — not near-identical items.
  const HINTS = {
    // Food & Drink
    apple:["core","orchard","crunch"], banana:["yellow","peel","bunch"], bread:["loaf","slice","toast"],
    butter:["spread","melt","pan"], cake:["slice","birthday","icing"], cheese:["dairy","grate","melt"],
    chicken:["roast","wing","farm"], chips:["crispy","salted","packet"], chocolate:["bar","sweet","cocoa"],
    coffee:["mug","caffeine","beans"], egg:["shell","boil","yolk"], fish:["sea","grill","scale"],
    jam:["jar","sweet","spread"], milk:["carton","dairy","glass"], orange:["peel","citrus","segment"],
    pasta:["boil","sauce","noodles"], pizza:["slice","box","topping"], rice:["bowl","grain","steam"],
    salad:["bowl","fresh","leaf"], salt:["shaker","pinch","grain"], sandwich:["lunch","slice","filling"],
    sauce:["bottle","pour","dip"], soup:["bowl","spoon","steam"], sugar:["sweet","cube","spoon"],
    tea:["kettle","bag","steam"],

    // Animals
    ant:["tiny","trail","hill"], bear:["forest","claws","hibernation"], bird:["wings","perch","tweet"],
    cat:["whiskers","purr","climb"], chicken:["coop","feather","cluck"], cow:["field","milk","herd"],
    deer:["antlers","woods","leap"], dog:["lead","bark","tail"], dolphin:["waves","smart","jump"],
    duck:["pond","quack","waddle"], eagle:["soar","talons","peak"], elephant:["trunk","huge","herd"],
    fish:["gills","river","scale"], fox:["sly","den","rusty"], frog:["pond","leap","green"],
    horse:["stable","saddle","gallop"], lion:["pride","mane","roar"], monkey:["bananas","swing","tree"],
    mouse:["small","squeak","cheese"], owl:["night","hoot","eyes"], pig:["mud","snout","farm"],
    rabbit:["ears","burrow","hop"], shark:["teeth","fin","ocean"], sheep:["wool","flock","field"],
    tiger:["stripes","prowl","jungle"],

    // Places
    airport:["gate","runway","luggage"], bank:["money","counter","card"], beach:["sand","waves","umbrella"],
    bridge:["river","span","arches"], "bus stop":["sign","route","bench"], cafe:["menu","mug","table"],
    church:["bell","pew","choir"], cinema:["screen","tickets","popcorn"], city:["towers","traffic","busy"],
    farm:["tractor","field","barn"], forest:["trees","trail","shade"], hospital:["nurse","ward","bed"],
    hotel:["reception","keycard","lobby"], island:["coast","boat","small"], library:["quiet","shelves","borrow"],
    market:["stalls","bargain","fresh"], mountain:["peak","trail","snow"], museum:["exhibit","guide","history"],
    office:["desk","printer","meeting"], park:["bench","grass","play"], river:["current","bridge","bank"],
    school:["class","bag","teacher"], shop:["till","shelf","bag"], station:["platform","train","tickets"],
    town:["main street","square","local"],

    // Objects & Things
    bag:["zip","carry","strap"], battery:["power","charge","pack"], book:["pages","read","cover"],
    bottle:["cap","plastic","drink"], broom:["handle","sweep","floor"], brush:["bristles","clean","stroke"],
    camera:["lens","flash","focus"], chair:["seat","legs","sit"], clock:["hands","alarm","time"],
    comb:["teeth","hair","tidy"], cup:["handle","hot","sip"], key:["lock","metal","ring"],
    knife:["sharp","cut","edge"], ladder:["rungs","climb","lean"], lamp:["shade","bulb","desk"],
    mirror:["glass","reflection","frame"], mobile:["screen","call","charge"], paper:["sheet","tear","note"],
    pen:["ink","cap","write"], pencil:["eraser","lead","sketch"], pillow:["soft","sleep","bed"],
    plate:["dish","round","serve"], spoon:["stir","bowl","silver"], table:["legs","dining","desk"],
    watch:["wrist","strap","tick"],

    // Sports & Games
    badminton:["shuttle","net","rally"], basketball:["hoop","bounce","court"], bowling:["pins","lane","strike"],
    boxing:["gloves","ring","round"], chess:["board","king","move"], cricket:["bat","over","wickets"],
    cycling:["helmet","pedal","road"], darts:["board","throw","triple"], football:["boots","goal","pitch"],
    golf:["club","green","par"], hockey:["stick","ice","goal"], karate:["belt","dojo","kick"],
    rowing:["oars","boat","cox"], rugby:["scrum","tackle","try"], running:["track","pace","lap"],
    skating:["wheels","rink","glide"], skiing:["snow","slope","sticks"], snooker:["cue","baize","break"],
    surfing:["board","wave","wax"], swimming:["lane","goggles","stroke"], "table tennis":["bat","spin","serve"],
    tennis:["serve","net","deuce"], volleyball:["spike","block","beach"], yoga:["mat","pose","stretch"],
    poker:["chips","bluff","river"],

    // Movies & TV
    actor:["role","stage","star"], camera:["lens","record","focus"], cartoon:["drawn","funny","short"],
    credits:["roll","names","end"], director:["cut","scene","guide"], extra:["background","crowd","brief"],
    film:["reel","movie","shoot"], hero:["save","main","brave"], makeup:["brush","powder","prosthetic"],
    poster:["wall","tease","art"], prop:["object","hand","set"], scene:["take","location","moment"],
    screen:["big","projector","glow"], script:["pages","lines","dialogue"], set:["build","backdrop","stage"],
    sound:["mic","boom","mix"], studio:["lights","crew","lot"], subtitle:["text","translate","line"],
    theme:["music","opening","tune"], ticket:["stub","entry","seat"], title:["name","top","card"],
    trailer:["preview","tease","short"], villain:["evil","plan","enemy"], voice:["record","line","actor"],
    wardrobe:["costume","rail","change"]
  };

  const API = {
    PACKS,
    HINTS,
    nextWord(pool){
      if(!pool || !pool.length) throw new Error("Pool is empty.");
      const mem = loadMem();
      const fresh = pool.filter(w => !mem.map[w]);
      const source = (fresh.length ? fresh : pool).slice();
      shuffle(source);
      const word = source[Math.floor(Math.random()*source.length)];
      remember(word);
      return word;
    },
    getHint(word){
      const key = (word||"").toLowerCase();
      const arr = HINTS[key];
      return arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : null;
    }
  };

  // Expose
  window.WORD_PACKS = PACKS;       // if you still build pools from this
  window.HINT_SYNONYMS = HINTS;    // optional direct access
  window.ImposterWords = API;      // preferred API
})();
