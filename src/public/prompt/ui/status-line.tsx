import { Text } from "react-native";
import type { JSX } from "react";

import type { PromptTheme } from "../theme";
import styles from "../views/styles";

type Props = {
  error: string | null;
  /** a step the user takes while it connects, e.g. the iOS Local Network question */
  notice: string | null;
  theme: PromptTheme;
};

/** What went wrong, or what the user has to do for the connection to go on. */
const StatusLine = ({ error, notice, theme }: Props): JSX.Element | null => {
  if (error)
    return <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>;
  if (notice)
    return <Text style={[styles.error, { color: theme.muted }]}>{notice}</Text>;
  return null;
};

export default StatusLine;
