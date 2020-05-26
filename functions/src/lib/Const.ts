export const DefaultBatchSize = 500;
export enum BatchType {
    Create,
    CreateWithId,
    Set,
    Update,
    Delete
}

export enum Gender {
    Unknown = 0
    , Male = 1
    , Female = 2
}

export enum ArenaState {
    WAIT = -1
    , READ = 0
    , CHECK = 1
    , ACT = 2
}

export const ArenaStateTime = {
    [ArenaState.WAIT]: -1
    , [ArenaState.READ]: 60 + 3
    , [ArenaState.CHECK]: 30
    , [ArenaState.ACT]: 180 + 1
}

export enum ArenaUserState {
    LISTNER = 0
    , ENTRY = 1
    , ACTOR = 2
}

export enum TheaterState {
    UNSET = -1,
    READ = 0,
    CHECK = 1,
    ACT = 2,
    END = 3,
}

export const TheaterStateTime = {
    [ArenaState.READ]: 10 * 60 + 3,
    [ArenaState.CHECK]: 5 * 60,
    [ArenaState.ACT]: 60 * 60 + 1,
}

export const ChatMax = 30;

export enum MatchingHour {
    HALF = 1,
    ONE = 2,
    ONEHALF = 3,
    TWO = 4,
}

export enum MatchingPlace {
    ACTARENA = 1,
    DISCORD = 2,
}

export enum PushBasicSettingKey {
    MORNING  = 1,
    DAYTIME  = 2,
    TWILIGHT = 3,
    EVENING  = 4,
    NIGHT    = 5,
    MIDNIGHT = 6,
    DAWN     = 7,
}

// 以上、未満で比較する
export const PushBasicSettingEndHour  = {
    [PushBasicSettingKey.MORNING]:  [9,12],
    [PushBasicSettingKey.DAYTIME]:  [12,15],
    [PushBasicSettingKey.TWILIGHT]: [15,18],
    [PushBasicSettingKey.EVENING]:  [18,21],
    [PushBasicSettingKey.NIGHT]:    [21,24],
    [PushBasicSettingKey.MIDNIGHT]: [0,2],
    [PushBasicSettingKey.DAWN]:     [2,9],
}

export const MatchingTime = 30 * 60; // 30minutes
export const PushIntervalHour = 1;