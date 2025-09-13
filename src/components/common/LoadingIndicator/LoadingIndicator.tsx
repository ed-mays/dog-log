export type LoadingIndicatorProps = {
  text?: string;
  'data-testid'?: string;
};

export function LoadingIndicator({
  text = 'Loading…',
  'data-testid': dataTestId = 'loading-indicator',
}: LoadingIndicatorProps) {
  return <div data-testid={dataTestId}>{text}</div>;
}
