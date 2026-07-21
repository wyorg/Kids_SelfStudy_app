export interface Mission {
  id: string;
  text: string;
  emoji: string;
  completed: boolean;
  isDefault?: boolean;
}

export interface ParentSettings {
  rewardText: string;
  pinCode: string;
  customMissions: Mission[];
}
