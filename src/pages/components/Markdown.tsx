import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { createMarkup } from '@/utils';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Skeleton } from '@mui/material';
import { Suspense } from 'react';

const StyledContainer = styled(Container)(() => ({
  height: '100%',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
  },
}));

const Loading = () => <StyledPaper>
  <Typography component="div" variant="h1">
    <Skeleton animation="wave" />
  </Typography>
  <Typography component="div" variant="caption">
    <Skeleton animation="wave" />
  </Typography>
  <Typography component="div" variant="body1">
    <Skeleton animation="wave" />
  </Typography>
  <Typography component="div" variant="body1">
    <Skeleton animation="wave" />
  </Typography>
  <Typography component="div" variant="body1">
    <Skeleton animation="wave" />
  </Typography>
</StyledPaper>;

const Data = observer(() => {
  const home = useStore('home');

  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  if (home.loading) throw new Promise<void>((res) => res());

  return <StyledPaper dangerouslySetInnerHTML={createMarkup(home.html)} />;
});

const Markdown = observer(() => <StyledContainer
  maxWidth={false}
  // required for github-markdown-css
  className="markdown-body"

>
  <Suspense fallback={<Loading />}>
    <Data />
  </Suspense>
</StyledContainer>);

export default Markdown;
