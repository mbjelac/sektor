// Where chance comes from. It is handed in rather than reached for, so that a test can say which
// way every draw falls and get the same sektor out every time.
export type RandomNumber = () => number;
