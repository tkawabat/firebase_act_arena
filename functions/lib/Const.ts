export enum Gender {
    Unknown = 0
    , Male = 1
    , Female = 2
}

export enum ArenaState {
    WAIT = 0
    , READY = 1
    , CONFIRM = 2
    , CHECK = 3
    , ACT = 4
}

export const ArenaStateTime = {
        [ArenaState.WAIT]: -1
        , [ArenaState.READY]: 8
        , [ArenaState.CONFIRM]: 8
        , [ArenaState.CHECK]: 8
        , [ArenaState.ACT]: 13
    }

export enum ArenaUserState {
    LISTNER = 0
    , ENTRY = 1
    , ACTOR = 2
}