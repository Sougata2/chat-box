const KEY = process.env.NEXT_PUBLIC_GIPHY_KEY;

export const searchGifs = async (q: string) => {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${KEY}&q=${q}&limit=25`,
  );
  const data = await res.json();
  return data.data;
};

export const trendingGifs = async () => {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/trending?api_key=${KEY}&limit=25`,
  );
  const data = await res.json();
  return data.data;
};

export const urlToFile = async (url: string, name: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type });
};
