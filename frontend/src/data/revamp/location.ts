export type CurrentLocation = {
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  status: string;
};

export const currentLocation: CurrentLocation = {
  city: "杭州",
  province: "浙江",
  latitude: 30.2741,
  longitude: 120.1551,
  status: "浙大学习与实习阶段长期停留",
};
