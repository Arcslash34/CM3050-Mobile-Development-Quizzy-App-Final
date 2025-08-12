// utils/categoryUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import localCategoryJSON from '../assets/data/opentdb_categories.json';

// AsyncStorage key for caching categories
const CATEGORY_CACHE_KEY = 'cached_categories';
// Cache expiration duration (30 days in milliseconds)
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 30;

// Mapping of category IDs to corresponding local images
const categoryImages = {
  9: require('../assets/categories/knowledge.jpg'),
  10: require('../assets/categories/books.jpg'),
  11: require('../assets/categories/film.jpg'),
  12: require('../assets/categories/music.jpg'),
  13: require('../assets/categories/musicals.jpg'),
  14: require('../assets/categories/television.jpg'),
  15: require('../assets/categories/video.jpg'),
  16: require('../assets/categories/board.jpg'),
  17: require('../assets/categories/science.jpg'),
  18: require('../assets/categories/computer.jpg'),
  19: require('../assets/categories/math.jpg'),
  20: require('../assets/categories/myth.jpg'),
  21: require('../assets/categories/sport.jpg'),
  22: require('../assets/categories/geography.jpg'),
  23: require('../assets/categories/history.jpg'),
  24: require('../assets/categories/politics.jpg'),
  25: require('../assets/categories/art.jpg'),
  26: require('../assets/categories/celebrities.jpg'),
  27: require('../assets/categories/animals.jpg'),
  28: require('../assets/categories/vehicles.jpg'),
  29: require('../assets/categories/comic.jpg'),
  30: require('../assets/categories/gadget.jpg'),
  31: require('../assets/categories/anime.jpg'),
  32: require('../assets/categories/cartoon.jpg'),
};

/**
 * Retrieves the list of trivia categories.
 * Uses this priority order:
 *  1. Valid cached data (not expired)
 *  2. Fresh fetch from OpenTrivia API (if online)
 *  3. Bundled local JSON (offline fallback)
 *  4. Placeholder categories (last resort)
 */
export const getTriviaCategories = async () => {
  try {
    // 1) Attempt to use cached data if not expired
    const cached = await AsyncStorage.getItem(CATEGORY_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) : null;
    const now = Date.now();

    if (parsed && now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data;
    }

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      // 2) Use cached data if offline
      if (parsed) return parsed.data;

      // 3) Use bundled local JSON fallback
      const fetched = localCategoryJSON?.trivia_categories ?? [];
      return Object.keys(categoryImages).map((id) => {
        const match = fetched.find((cat) => cat.id == id);
        const name = match ? match.name.replace(/^Entertainment:\s*/, '') : `Category ${id}`;
        return { id: Number(id), title: name, img: categoryImages[id] };
      });
    }

    // 4) Fetch from API if online
    const res = await fetch('https://opentdb.com/api_category.php');
    const json = await res.json();
    const fetched = json.trivia_categories;

    // Map and attach images
    const formatted = Object.keys(categoryImages).map((id) => {
      const match = fetched.find(cat => cat.id == id);
      const name = match ? match.name.replace(/^Entertainment:\s*/, '') : `Category ${id}`;
      return {
        id: Number(id),
        title: name,
        img: categoryImages[id],
      };
    });

    // Save fetched data to cache
    await AsyncStorage.setItem(
      CATEGORY_CACHE_KEY,
      JSON.stringify({ data: formatted, timestamp: now })
    );

    return formatted;
  } catch (err) {
    console.error('Failed to fetch trivia categories:', err);

    // Fallbacks inside catch-block:

    // 1) Try cache again in case fetch failed mid-process
    try {
      const cached = await AsyncStorage.getItem(CATEGORY_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data) {
          console.log('[categories] using CACHED data (after fetch failure)');
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('[categories] failed reading cache after fetch failure:', e);
    }

    // 2) Try bundled JSON if available
    try {
      const fetched = localCategoryJSON?.trivia_categories ?? [];
      if (fetched.length) {
        const now = Date.now();
        const formatted = Object.keys(categoryImages).map((id) => {
          const match = fetched.find((cat) => cat.id == id);
          const name = match ? match.name.replace(/^Entertainment:\s*/, '') : `Category ${id}`;
          return { id: Number(id), title: name, img: categoryImages[id] };
        });
        await AsyncStorage.setItem(
          CATEGORY_CACHE_KEY,
          JSON.stringify({ data: formatted, timestamp: now })
        );
        console.log('[categories] using BUNDLED JSON (and cached it)');
        return formatted;
      } else {
        console.warn('[categories] bundled JSON was empty');
      }
    } catch (e) {
      console.warn('[categories] failed using bundled JSON:', e);
    }

    // 3) As a last resort, return placeholder categories
    return Object.keys(categoryImages).map((id) => ({
      id: Number(id),
      title: `Category ${id}`,
      img: categoryImages[id],
    }));
  }
};

/**
 * Get the image for a given category ID.
 * Returns a default image if ID not found.
 */
export const getCategoryImageById = (id) => {
  return categoryImages[id] || require('../assets/categories/geography.jpg');
};
