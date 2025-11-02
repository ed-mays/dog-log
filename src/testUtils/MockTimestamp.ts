export class MockTimestamp {
  constructor(
    public seconds: number,
    public nanoseconds: number
  ) {}
  toDate(): Date {
    return new Date(this.seconds * 1000);
  }
  static fromDate(date: Date): MockTimestamp {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
  }
}
