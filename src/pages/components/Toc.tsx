import {
  alpha, withStyles, Theme, createStyles,
} from '@material-ui/core/styles';
import TreeItem, { TreeItemProps } from '@material-ui/lab/TreeItem';
import { DocToc } from '@/types';

const StyledTreeItem = withStyles((theme: Theme) => createStyles({
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}))((props: TreeItemProps) => <TreeItem {...props} />);

const Toc = ({ toc }: { toc: DocToc }) => (toc.children.length > 0
  ? <StyledTreeItem nodeId={toc.name} label={toc.name}>
    {
      toc.children.map((child) => <Toc key={child.name} toc={child} />)
    }
  </StyledTreeItem>
  : <StyledTreeItem nodeId={toc.name} label={toc.name} />
);

export default Toc;
