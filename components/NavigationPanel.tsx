import { LinkIcon } from '@heroicons/react/outline'
import { ChatIcon } from '@heroicons/react/outline'
import { ArrowSmRightIcon } from '@heroicons/react/solid'
import { useEffect, useState } from 'react'
import useXmtp from '../hooks/useXmtp'
import ConversationsList from './ConversationsList'
import Loader from './Loader'
import LitJsSdk from 'lit-js-sdk'

type NavigationPanelProps = {
  onConnect: () => Promise<void>
  condition: any
  filter: boolean
}

type ConversationsPanelProps = {
  condition: any
  filter: boolean
}

type ConnectButtonProps = {
  onConnect: () => Promise<void>
}

const NavigationPanel = ({ onConnect, condition, filter }: NavigationPanelProps): JSX.Element => {
  const { walletAddress } = useXmtp()

  return (
    <div className="flex-grow flex flex-col">
      {walletAddress ? (
        <ConversationsPanel condition={condition} filter={filter} />
      ) : (
        <NoWalletConnectedMessage>
          <ConnectButton onConnect={onConnect} />
        </NoWalletConnectedMessage>
      )}
    </div>
  )
}

const NoWalletConnectedMessage: React.FC = ({ children }) => {
  return (
    <div className="flex flex-col flex-grow justify-center">
      <div className="flex flex-col items-center px-4 text-center">
        <LinkIcon
          className="h-8 w-8 mb-1 stroke-n-200 md:stroke-n-300"
          aria-hidden="true"
        />
        <p className="text-xl md:text-lg text-n-200 md:text-n-300 font-bold">
          No wallet connected
        </p>
        <p className="text-lx md:text-md text-n-200 font-normal">
          Please connect a wallet to begin
        </p>
      </div>
      {children}
    </div>
  )
}

const ConnectButton = ({ onConnect }: ConnectButtonProps): JSX.Element => {
  return (
    <button
      onClick={onConnect}
      className="rounded border border-l-300 mx-auto my-4 text-l-300 hover:text-white hover:bg-l-400 hover:border-l-400 hover:fill-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-n-100 focus-visible:outline-none active:bg-l-500 active:border-l-500 active:text-l-100 active:ring-0"
    >
      <div className="flex items-center justify-center text-xs font-semibold px-4 py-1">
        Connect your wallet
        <ArrowSmRightIcon className="h-4" />
      </div>
    </button>
  )
}

const ConversationsPanel = ({ condition, filter }: ConversationsPanelProps): JSX.Element => {
  const { conversations, loadingConversations, client } = useXmtp()
  const [ loading, setLoading ] = useState(false)
  const [ filtered, setFiltered ] = useState<any[][]>()
  const chain = "rinkeby"
  const baseUrl = "http://localhost:3000"
  const peers = conversations.map(conversation => conversation.peerAddress)

  useEffect(() => {
    const filterMessages = async() => {
      if ( !filter )
        return
      
      setLoading(true)
      
      const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false })
      await client.connect()

      const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain })

      const getFiltered = async (address: string) => {
        try {
          let accessControlConditions = condition.accessControlConditions
	  console.log(accessControlConditions)
          accessControlConditions[0].parameters[0] = address

          const randomUrlPath =
            "/" +
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
          const resourceId = {
            baseUrl,
            path: randomUrlPath,
            orgId: "",
            role: "",
            extraData: ""
          }

          await client.saveSigningCondition({ 
            accessControlConditions, 
            chain, 
            authSig, 
            resourceId })

          const jwt = await client.getSignedToken({
            accessControlConditions,
            chain,
            authSig,
            resourceId
          })

          const { verified } = LitJsSdk.verifyJwt({ jwt })
          return [address, verified]
        } catch (err) {
          console.log(err)
        }

        return [address, false]
      }

      const promises = peers.map(peer => getFiltered(peer))
      const filteredList = await Promise.all(promises)

      setFiltered(filteredList)
      setLoading(false)
    }

    filterMessages();
  }, [filter, condition])

  let filteredObjects: any = {}
  if ( filtered?.length ) {
    filtered?.forEach( ([address, verified]) => {
      filteredObjects[address] = verified
    })
  }

  if (!client) {
    return (
      <Loader
        headingText="Awaiting signatures..."
        subHeadingText="Use your wallet to sign"
        isLoading
      />
    )
  }
  if (loadingConversations || loading) {
    return (
      <Loader
        headingText="Loading conversations..."
        subHeadingText="Please wait a moment"
        isLoading
      />
    )
  }

  const filteredConversations = filter ? conversations.filter( conversation => filteredObjects[conversation.peerAddress] ) : conversations

  return filteredConversations && filteredConversations.length > 0 ? (
    <nav className="flex-1 pb-4 space-y-1">
      <ConversationsList conversations={filteredConversations} />
    </nav>
  ) : (
    <NoConversationsMessage />
  )
}

const NoConversationsMessage = (): JSX.Element => {
  return (
    <div className="flex flex-col flex-grow justify-center">
      <div className="flex flex-col items-center px-4 text-center">
        <ChatIcon
          className="h-8 w-8 mb-1 stroke-n-200 md:stroke-n-300"
          aria-hidden="true"
        />
        <p className="text-xl md:text-lg text-n-200 md:text-n-300 font-bold">
          Your message list is empty
        </p>
        <p className="text-lx md:text-md text-n-200 font-normal">
          There are no messages in this wallet
        </p>
      </div>
    </div>
  )
}

export default NavigationPanel
