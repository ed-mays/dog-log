export type ErrorIndicatorProps = {
  text?: string;
  'data-testid'?: string;
};

export function ErrorIndicator({
  text = 'Error...',
  'data-testid': dataTestId = 'error-indicator',
}: ErrorIndicatorProps) {
  return <div data-testid={dataTestId}>{text}</div>;
}
