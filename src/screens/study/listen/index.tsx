import type { Scope } from '@/types';
import { ControlledListen, type ControlledListenProps } from './Controlled';
import { StandaloneListen } from './Standalone';

type Props =
  | { languageId: string; scope: Scope; controlled?: undefined }
  | {
      controlled: ControlledListenProps;
      languageId?: undefined;
      scope?: undefined;
    };

export function ListenMode(props: Props) {
  if (props.controlled) {
    return <ControlledListen {...props.controlled} />;
  }
  return <StandaloneListen languageId={props.languageId} scope={props.scope} />;
}
