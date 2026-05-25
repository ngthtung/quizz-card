import type { Scope } from '@/types';
import { ControlledMC, type ControlledMCProps } from './Controlled';
import { StandaloneMC } from './Standalone';

type Props =
  | { languageId: string; scope: Scope; controlled?: undefined }
  | {
      controlled: ControlledMCProps;
      languageId?: undefined;
      scope?: undefined;
    };

export function MultipleChoiceMode(props: Props) {
  if (props.controlled) {
    return <ControlledMC {...props.controlled} />;
  }
  return <StandaloneMC languageId={props.languageId} scope={props.scope} />;
}
