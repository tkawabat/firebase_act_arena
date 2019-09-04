export enum Gender {
    Unknown = 0
    , Male = 1
    , Female = 2
}

export enum ArenaState {
    WAIT = 0
    , CONFIRM = 1
    , CHECK = 2
    , ACT = 3
}

export const ArenaStateTime = {
        [ArenaState.WAIT]: -1
        , [ArenaState.CONFIRM]: 8
        , [ArenaState.CHECK]: 8
        , [ArenaState.ACT]: 13
    }

export enum ArenaUserState {
    LISTNER = 0
    , ENTRY = 1
    , ACTOR = 2
}