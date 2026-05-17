import { useCancelDownloadModel, useDownloadModel, useLanguages } from '@open-bisbis/hooks'
import { useMemo } from 'react'
import { Card, useToast } from '../../components'
import { CardFooter } from './CardFooter'
import { useDownload } from './useDownload'

interface ModelProps {
  name: string
  id: string
  size: number
  accuracy: number
  speed: number
  onSelect: (id: string, language: string) => void
  onDelete: (id: string) => void
  isDownloaded?: boolean
  isSelected: boolean
  language: string
}

export const Model = ({
  name,
  id,
  size,
  accuracy,
  speed,
  onSelect,
  onDelete,
  isDownloaded,
  isSelected,
  language,
}: ModelProps) => {
  const {
    isDownloading,
    progress: downloadProgress,
    start,
    stop,
  } = useDownload(id, () => {
    onSelect(id, language)
  })

  const { data: languages } = useLanguages()
  const downloadMutation = useDownloadModel()
  const cancelMutation = useCancelDownloadModel()
  const { toast } = useToast()

  const handleDownload = () => {
    if (isDownloading) return
    start()
    downloadMutation.mutate(id, {
      onError: () => {
        toast('Failed to start download', 'error')
        stop()
      },
    })
  }

  const handleCancel = () => {
    cancelMutation.mutate(id, {
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
      onSelect(id, language)
    } else if (!isDownloaded) {
      handleDownload()
    }
  }

  return (
    <Card
      title={name}
      isSelected={isSelected}
      onSelect={onClickHandler}
      extras={
        <>
          {isSelected && (
            <div className="badge badge-soft badge-outline badge-success badge-xs uppercase font-bold">IN USE</div>
          )}
          {isDownloaded && !isSelected && (
            <div className="badge badge-xs opacity-75 uppercase font-bold">READY TO USE</div>
          )}
        </>
      }
      footer={
        <CardFooter
          size={size}
          downloadProgress={downloadProgress}
          isDownloaded={isDownloaded}
          onDownload={handleDownload}
          onCancel={isDownloading ? handleCancel : undefined}
          onDelete={isDownloaded && !isSelected ? handleDelete : undefined}
        />
      }
    >
      <div className="flex gap-4 w-full">
        <div className="w-1/2">
          <div className="flex items-center gap-2">
            <label className="label text-xs text-gray-400 font-medium">Language: </label>
            <SelectLanguage
              language={language}
              languages={languages}
              onSelect={(lang) => onSelect(id, lang)}
              isDisabled={!isSelected}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <ModelRating value={accuracy} label="Accuracy" />
          <ModelRating value={speed} label="Speed" />
        </div>
      </div>
    </Card>
  )
}

const ModelRating = ({ value, label }: { value: number; label: string }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-sm text-gray-500">{label}</div>
      <progress className="progress progress-success w-full min-w-12 opacity-50" value={value} max="10"></progress>
    </div>
  )
}

type SelectLanguageProps = {
  language: string
  languages?: { code: string; language: string }[]
  onSelect: (language: string) => void
  isDisabled: boolean
}

const SelectLanguage = ({ language, languages, onSelect, isDisabled }: SelectLanguageProps) => {
  const selectedLanguage = useMemo(() => {
    const lang = languages?.find((lang) => lang.code === language)?.language
    if (lang) {
      return lang.charAt(0).toUpperCase() + lang.slice(1)
    }
    return ''
  }, [language, languages])

  return !isDisabled ? (
    <select
      className="select select-xs w-full max-w-xs select-primary"
      value={language}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onSelect(e.target.value)}
    >
      {languages?.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}
        </option>
      ))}
    </select>
  ) : (
    <span className="text-xs text-gray-400">{selectedLanguage}</span>
  )
}
