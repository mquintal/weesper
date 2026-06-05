import { MagicWandIcon } from '@radix-ui/react-icons'
import { useCancelDownloadLlm, useDownloadLlm, useSelectLlm } from '@weesper/hooks'
import { Card, useToast } from '@/components'
import { CardFooter } from '../models/CardFooter'
import { useDownload } from '../models/useDownload'

interface LlmProps {
  name: string
  id: string
  size: number
  onDelete: (id: string) => void
  isDownloaded?: boolean
  isSelected: boolean
}

export const Llm = ({ name, id, size, onDelete, isDownloaded, isSelected }: LlmProps) => {
  const { mutate: selectMutation } = useSelectLlm()
  const { mutate: downloadMutation } = useDownloadLlm()
  const { mutate: cancelMutation } = useCancelDownloadLlm()
  const { toast } = useToast()

  const {
    isDownloading,
    progress: downloadProgress,
    start,
    stop,
  } = useDownload(id, () => {
    selectMutation(id, {
      onError: () => toast('Failed to select model', 'error'),
    })
  })

  const handleDownload = async () => {
    if (isDownloading) return
    start()
    downloadMutation(id, {
      onError: () => {
        toast('Failed to start download', 'error')
        stop()
      },
    })
  }

  const handleCancel = async () => {
    cancelMutation(id, {
      onSuccess: () => {
        stop()
      },
      onError: () => {
        toast('Failed to cancel download', 'error')
        stop()
      },
    })
  }

  const handleDelete = () => {
    onDelete(id)
  }

  const onClickHandler = () => {
    if (isDownloaded && !isSelected) {
      selectMutation(id, {
        onError: () => toast('Failed to select model', 'error'),
      })
    } else if (!isDownloaded) {
      handleDownload()
    }
  }

  return (
    <Card
      title={name}
      onSelect={onClickHandler}
      isSelected={isSelected}
      extras={
        isSelected && (
          <div className="badge badge-soft badge-outline badge-success badge-xs uppercase font-bold">IN USE</div>
        )
      }
      footer={
        <CardFooter
          size={size}
          downloadProgress={downloadProgress}
          isDownloaded={isDownloaded}
          onDelete={isDownloaded && !isSelected ? handleDelete : undefined}
          onCancel={isDownloading ? handleCancel : undefined}
          onDownload={handleDownload}
        />
      }
    >
      <p className="text-sm text-gray-500 ">
        <MagicWandIcon className="inline mr-2 text-violet-600" />
        This model is used to enhance your transcriptions into effective prompts, chats or any other type of text you
        are working on.
      </p>
    </Card>
  )
}
