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

export const ChatMax = 30;