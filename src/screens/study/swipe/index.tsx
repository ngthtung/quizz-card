import type { Scope } from '@/types';
import { ControlledSwipe, type ControlledSwipeProps } from './Controlled';
import { StandaloneSwipe } from './Standalone';

type Props =
  | { languageId: string; scope: Scope; controlled?: undefined }
  | {
      controlled: ControlledSwipeProps;
      languageId?: undefined;
      scope?: undefined;
    };

export function SwipeMode(props: Props) {
  if (props.controlled) {
    return <ControlledSwipe {...props.controlled} />;
  }
  return <StandaloneSwipe languageId={props.languageId} scope={props.scope} />;
}
