import type { Scope } from '@/types';
import { ControlledWrite, type ControlledWriteProps } from './Controlled';
import { StandaloneWrite } from './Standalone';

type Props =
  | { languageId: string; scope: Scope; controlled?: undefined }
  | {
      controlled: ControlledWriteProps;
      languageId?: undefined;
      scope?: undefined;
    };

export function WriteMode(props: Props) {
  if (props.controlled) {
    return <ControlledWrite {...props.controlled} />;
  }
  return <StandaloneWrite languageId={props.languageId} scope={props.scope} />;
}
