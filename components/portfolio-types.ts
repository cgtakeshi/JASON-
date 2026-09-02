export type PortfolioWork = {
  id: string;
  title: string;
  titleEn?: string;
  tag: string;
  project: string;
  image: string;
  media: "image" | "video";
  cover: boolean;
  hidden?: boolean;
  width: number;
  height: number;
};
